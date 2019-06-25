import {
  DismissNewFeatureMutation as TDismissNewFeatureMutation,
  DismissNewFeatureMutationVariables
} from '__generated__/DismissNewFeatureMutation.graphql'
import {commitMutation, graphql} from 'react-relay'
import {Disposable} from 'relay-runtime'
import {LocalHandlers} from '../types/relayMutations'

const mutation = graphql`
  mutation DismissNewFeatureMutation {
    dismissNewFeature {
      error {
        title
      }
    }
  }
`

const DismissNewFeatureMutation = (
  atmosphere,
  variables: DismissNewFeatureMutationVariables,
  {onCompleted, onError}: LocalHandlers
): Disposable => {
  return commitMutation<TDismissNewFeatureMutation>(atmosphere, {
    mutation,
    variables,
    updater: (store) => {
      const viewer = store.getRoot().getLinkedRecord('viewer')!
      viewer.setValue(null, 'newFeature')
    },
    optimisticUpdater: (store) => {
      const viewer = store.getRoot().getLinkedRecord('viewer')!
      viewer.setValue(null, 'newFeature')
    },
    onError,
    onCompleted
  })
}

export default DismissNewFeatureMutation
