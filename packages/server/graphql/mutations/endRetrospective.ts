import {GraphQLID, GraphQLNonNull} from 'graphql'
import {SubscriptionChannel} from 'parabol-client/types/constEnums'
import {NewMeetingPhaseTypeEnum, SuggestedActionTypeEnum} from 'parabol-client/types/graphql'
import {DISCUSS} from 'parabol-client/utils/constants'
import getMeetingPhase from 'parabol-client/utils/getMeetingPhase'
import findStageById from 'parabol-client/utils/meetings/findStageById'
import getRethink from '../../database/rethinkDriver'
import MeetingRetrospective from '../../database/types/MeetingRetrospective'
import TimelineEventRetroComplete from '../../database/types/TimelineEventRetroComplete'
import removeSuggestedAction from '../../safeMutations/removeSuggestedAction'
import {getUserId, isTeamMember} from '../../utils/authorization'
import publish from '../../utils/publish'
import segmentIo from '../../utils/segmentIo'
import standardError from '../../utils/standardError'
import {DataLoaderWorker, GQLContext} from '../graphql'
import EndRetrospectivePayload from '../types/EndRetrospectivePayload'
import sendNewMeetingSummary from './helpers/endMeeting/sendNewMeetingSummary'
import {endSlackMeeting} from './helpers/notifySlack'
import removeEmptyTasks from './helpers/removeEmptyTasks'

const finishRetroMeeting = async (meeting: MeetingRetrospective, dataLoader: DataLoaderWorker) => {
  const {id: meetingId} = meeting
  const r = await getRethink()
  const [reflectionGroups, reflections] = await Promise.all([
    dataLoader.get('retroReflectionGroupsByMeetingId').load(meetingId),
    dataLoader.get('retroReflectionsByMeetingId').load(meetingId)
  ])
  const reflectionGroupIds = reflectionGroups.map(({id}) => id)

  await r
    .table('NewMeeting')
    .get(meetingId)
    .update(
      {
        commentCount: (r
          .table('Comment')
          .getAll(r.args(reflectionGroupIds), {index: 'threadId'})
          .filter({isActive: true})
          .count()
          .default(0) as unknown) as number,
        taskCount: (r
          .table('Task')
          .getAll(r.args(reflectionGroupIds), {index: 'threadId'})
          .count()
          .default(0) as unknown) as number,
        topicCount: reflectionGroupIds.length,
        reflectionCount: reflections.length
      },
      {nonAtomic: true}
    )
    .run()
}

export default {
  type: new GraphQLNonNull(EndRetrospectivePayload),
  description: 'Finish a retrospective meeting',
  args: {
    meetingId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The meeting to end'
    }
  },
  async resolve(_source, {meetingId}, context: GQLContext) {
    const {authToken, socketId: mutatorId, dataLoader} = context
    const r = await getRethink()
    const operationId = dataLoader.share()
    const subOptions = {mutatorId, operationId}
    const now = new Date()
    const viewerId = getUserId(authToken)

    // AUTH
    const meeting = (await r
      .table('NewMeeting')
      .get(meetingId)
      .default(null)
      .run()) as MeetingRetrospective | null
    if (!meeting) return standardError(new Error('Meeting not found'), {userId: viewerId})
    const {endedAt, facilitatorStageId, meetingNumber, phases, teamId, meetingType} = meeting

    // VALIDATION
    if (!isTeamMember(authToken, teamId) && authToken.rol !== 'su') {
      return standardError(new Error('Team not found'), {userId: viewerId})
    }
    if (endedAt) return standardError(new Error('Meeting already ended'), {userId: viewerId})

    // RESOLUTION
    const currentStageRes = findStageById(phases, facilitatorStageId)
    if (!currentStageRes) {
      return standardError(new Error('Cannot find facilitator stage'), {userId: viewerId})
    }
    const {stage} = currentStageRes
    const phase = getMeetingPhase(phases)
    stage.isComplete = true
    stage.endAt = now

    const completedRetrospective = ((await r
      .table('NewMeeting')
      .get(meetingId)
      .update(
        {
          endedAt: now,
          phases
        },
        {returnChanges: true}
      )('changes')(0)('new_val')
      .run()) as unknown) as MeetingRetrospective

    // remove any empty tasks
    const removedTaskIds = await removeEmptyTasks(meetingId)

    const [meetingMembers, team] = await Promise.all([
      dataLoader.get('meetingMembersByMeetingId').load(meetingId),
      dataLoader.get('teams').load(teamId)
    ])
    const presentMembers = meetingMembers.filter(
      (meetingMember) => meetingMember.isCheckedIn === true
    )
    const presentMemberUserIds = presentMembers.map(({userId}) => userId)
    endSlackMeeting(meetingId, teamId, dataLoader).catch(console.log)
    finishRetroMeeting(completedRetrospective, dataLoader)
    const {facilitatorUserId, templateId} = completedRetrospective
    const template = await dataLoader.get('meetingTemplates').load(templateId)
    const {name: meetingTemplateName} = template
    presentMemberUserIds.forEach((userId) => {
      const wasFacilitator = userId === facilitatorUserId
      segmentIo.track({
        userId,
        event: 'Meeting Completed',
        properties: {
          hasIcebreaker: phases[0].phaseType === NewMeetingPhaseTypeEnum.checkin,
          // include wasFacilitator as a flag to handle 1 per meeting
          wasFacilitator,
          userIds: wasFacilitator ? presentMemberUserIds : undefined,
          meetingType,
          meetingTemplateName,
          meetingNumber,
          teamMembersCount: meetingMembers.length,
          teamMembersPresentCount: presentMembers.length,
          teamId
        }
      })
    })
    sendNewMeetingSummary(completedRetrospective, context).catch(console.log)
    const events = meetingMembers.map(
      (meetingMember) =>
        new TimelineEventRetroComplete({
          userId: meetingMember.userId,
          teamId,
          orgId: team.orgId,
          meetingId
        })
    )
    const timelineEventId = events[0].id as string
    await r
      .table('TimelineEvent')
      .insert(events)
      .run()
    if (team.isOnboardTeam) {
      const teamLeadUserId = await r
        .table('TeamMember')
        .getAll(teamId, {index: 'teamId'})
        .filter({isLead: true})
        .nth(0)('userId')
        .run()

      const removedSuggestedActionId = await removeSuggestedAction(
        teamLeadUserId,
        SuggestedActionTypeEnum.tryRetroMeeting
      )
      if (removedSuggestedActionId) {
        publish(
          SubscriptionChannel.NOTIFICATION,
          teamLeadUserId,
          'EndRetrospectiveSuccess',
          {removedSuggestedActionId},
          subOptions
        )
      }
    }

    const data = {
      meetingId,
      teamId,
      isKill: ![DISCUSS].includes(phase.phaseType),
      removedTaskIds,
      timelineEventId
    }
    publish(SubscriptionChannel.TEAM, teamId, 'EndRetrospectiveSuccess', data, subOptions)

    return data
  }
}
