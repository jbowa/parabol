import React from 'react'
import useCanonical from '~/hooks/useCanonical'
import useAtmosphere from '../hooks/useAtmosphere'
import useDocumentTitle from '../hooks/useDocumentTitle'
import useRouter from '../hooks/useRouter'
import getValidRedirectParam from '../utils/getValidRedirectParam'
import GenericAuthentication, {AuthPageSlug, GotoAuthPage} from './GenericAuthentication'
import TeamInvitationWrapper from './TeamInvitationWrapper'

interface Props {
  page: AuthPageSlug
}

const AuthenticationPage = (props: Props) => {
  const {history} = useRouter()
  const {page} = props
  const atmosphere = useAtmosphere()
  const {authObj} = atmosphere
  useDocumentTitle('Sign Up for Free Online Retrospectives | Parabol', 'Sign Up')
  useCanonical(page)
  if (authObj) {
    const nextUrl = getValidRedirectParam() || '/meetings'
    // always replace otherwise they could get stuck in a back-button loop
    setTimeout(() => history.replace(nextUrl))
    return null
  }
  const gotoPage: GotoAuthPage = (page, search?) => {
    history.push(`/${page}${search}`)
  }
  return (
    <TeamInvitationWrapper>
      <GenericAuthentication page={page} gotoPage={gotoPage} />
    </TeamInvitationWrapper>
  )
}

export default AuthenticationPage
