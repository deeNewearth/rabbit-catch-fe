import React from 'react';
import logo from './logo.svg';
import './App.scss';
import { Link, Route } from "wouter";

import {Connect} from './components/web3';

const AppOld = () => (
  <div>
    <h1>Application</h1>

    <Link href="/users/JohnDoe">
      <a className="link">Profile</a>
    </Link>

    <Connect/>

    <Route path="/users/:username">
      {(params) => <div>Hello, {params.username}!</div>}
    </Route>

  </div>
);

export default function(){
  return <div className='app d-flex justify-content-center align-items-center'>
    <Connect/>
  </div>;
};
