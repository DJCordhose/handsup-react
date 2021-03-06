import React from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'react-apollo'

import { withRouter } from 'react-router-dom'

import TopNavigation from './TopNavigation'
import AddQuestion from './AddQuestion'
import QuestionList from './QuestionList'

import USER_QUERY from '../graphql/User.query.gql'
import CREATE_USER_MUTATION from '../graphql/CreateUser.mutation.gql'

import { setUserDetails, ALERT_DEFAULT } from '../utils/helpers'
import Alert from 'react-s-alert'

class HandsUpAppBase extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      isLogged: false,
    }
    this.props.auth.on('profile-updated', this.updateIsLogged.bind(this))
  }

  updateIsLogged(profile) {
    this.setState({
      isLogged: !!profile,
    })
  }

  componentWillMount() {
    if (this.props.auth.profile) {
      this.updateState({ isLogged: true })
    }
  }

  updateState(state) {
    this.setState(state)
    if (this.props.auth.profile) {
      const variables = setUserDetails(this.props.auth)
      this.props.createUser({ variables }).catch(e => {
        if (e.graphQLErrors) {
          e.graphQLErrors.forEach(error => {
            switch (error.code) {
              case 3023:
                break // existing user
              default:
                console.error(error)
            }
          }, this)
        }
      })
    }
  }

  componentWillUnmount() {
    this.props.auth.removeListener('profile-updated', this.updateIsLogged.bind(this))
  }

  render() {
    let addQuestion = null
    if (this.state.isLogged) {
      addQuestion = (
        <AddQuestion auth={this.props.auth} />
      )
    }

    return (
      <div className='app' id='app'>
        <TopNavigation auth={this.props.auth} isLogged={this.state.isLogged} {...this.props} />
        {addQuestion}
        <QuestionList auth={this.props.auth} />
        <div className='flying-hearts' />
        <Alert stack={{limit: 3}} />
      </div>
    )
  }
}
const HandsUpApp = withRouter(HandsUpAppBase)

const withUser = graphql(USER_QUERY, {
  options: {
    fetchPolicy: 'network-only',
  },
  props: ({ ownProps, data }) => {
    // User logged using Auth0. This is graphcool userId
    // Eg: required to add questions and voting
    // We store it in the Authorisation class
    if (data.user && data.user.id) {
      ownProps.auth.userId = data.user.id
    }
    if (data.user && data.user.role) {
      ownProps.auth.role = data.user.role
    }
    if (data.user && data.user.flagged) {
      ownProps.auth.flagged = data.user.flagged
    }
    return {
      user: data.user,
    }
  },
})

const withCreateUser = graphql(CREATE_USER_MUTATION, {
  props: ({ ownProps, mutate }) => ({
    createUser({ variables }) {
      // user already logged in
      if (ownProps.auth.profile && ownProps.auth.userId) {
        return Promise.resolve(null)
      }
      return mutate({
        variables: {
          idToken: variables.idToken,
          name: variables.name,
          username: variables.username,
          pictureUrl: variables.profileUrl,
          role: variables.role,
        },
        updateQueries: {
          questions: (state, { mutationResult }) => {
            ownProps.auth.userId = mutationResult.data.createUser.id
            return state
          },
        },
      }).catch(error => {
        if (error.graphQLErrors) {
          error.graphQLErrors.forEach(error => {
            switch (error.code) {
              case 3023:
                Alert.info('Welcome back! 👋', ALERT_DEFAULT)
                break // existing user
              default:
                Alert.error(error.message, ALERT_DEFAULT)
            }
          }, this)
        }
      })
    },
  }),
})

HandsUpApp.propTypes = {
  auth: PropTypes.object.isRequired,
}

export default withCreateUser(withUser(HandsUpApp))

