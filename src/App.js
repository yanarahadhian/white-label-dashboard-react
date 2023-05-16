import React, { Component } from 'react';
// import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import PageContainer from './components/page_container';
import './App.css';
import './templates/button.css'
import 'antd/dist/antd.css';
import 'react-bootstrap-table/dist/react-bootstrap-table-all.min.css';

class App extends Component {
  
  componentDidMount() {
    const token = localStorage.getItem('token');

    if (token === null || token === undefined) {
      this.props.history.push('/login')
    }
  }

  render() {
    return (
      <div className="App">
        <PageContainer />
      </div>
    );
  }
}

export default withRouter (App);
