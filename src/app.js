import React from 'react'
import { render } from 'react-dom'
import HandsUpApp from './components/HandsUpApp'

import { ApolloProvider } from 'react-apollo'
import { client } from './client'
import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import { HashRouter, Route } from 'react-router-dom'
import Authorisation from './services/Authorisation'
import './style.css'
import 'react-s-alert/dist/s-alert-default.css'
import 'react-s-alert/dist/s-alert-css-effects/slide.css'

const combinedReducer = combineReducers({
  apollo: client.reducer(),
})

const store = compose(
  applyMiddleware(
    client.middleware(),
  ),
  window.devToolsExtension ? window.devToolsExtension() : f => f
)(createStore)(combinedReducer)

const auth = new Authorisation()

// functional component: https://facebook.github.io/react/docs/components-and-props.html#functional-and-class-components
const HandsUpAppWrapper = () => <HandsUpApp auth={auth} client={client} />
// class HandsUpAppWrapper extends React.Component {
//   render() {
//     return (
//       <HandsUpApp auth={auth} client={client} />
//     )
//   }
// }

render(
  <ApolloProvider store={store} client={client}>
    <HashRouter>
      <Route path='/' component={HandsUpAppWrapper} />
      {/* Even simpler */}
      {/* <Route path='/' component={() => <HandsUpApp auth={auth} client={client} />} /> */}
    </HashRouter>
  </ApolloProvider>,
  document.getElementById('root')
)
