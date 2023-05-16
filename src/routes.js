import React, { Component } from 'react';
import { Route, BrowserRouter as Router } from 'react-router-dom';
import Dashboard from './components/dashboard';
import Login from './components/login';
import LoperAccount from './components/loper_account';
import AgentAccount from './components/agent_account';
import TransactionLogs from './components/transaction_logs';
import WalletLogs from './components/wallet_logs';
import Users from './components/users';
import VirtualAccount from './components/virtual_account';
import Network from './components/network';
import Area from './components/area';
import Role from './components/role';
import VirtualAccountLogs from './components/virtual_account_logs';
import Wallet from './components/wallet';
import Customer from './components/customer';
import TopUp from './components/top_up';
import MyProfile from './components/profile';
import Sender from './components/sender';
import Subscription from './components/subscription';
import ForgotPassword from './components/forgot_password';
import District from './components/district';
import SubscriptionLogs from './components/subscription_logs';
import Help from './components/help';
import BillerHost from './components/biller_host';
import Product from './components/product';
import ProductAssignment from './components/product_assignment';
import MenuAccount from './components/menu';
import ProductUpload from './components/product_upload';
import Statistics from './components/statistics';

// eslint-disable-next-line
import App from './App';

class Routes extends Component {

    render() {
        return (
            <div>
                <Router>
                    <div>
                        <Route exact path="/" component={Dashboard} />
                        <Route exact path="/home" component={Dashboard} />
                        <Route path="/loper_account" component={LoperAccount} />
                        <Route path="/agent_account" component={AgentAccount} />
                        <Route path="/transaction_logs" component={TransactionLogs} />
                        <Route path="/wallet_logs" component={WalletLogs} />
                        <Route path="/users" component={Users} />
                        <Route path="/network" component={Network} />
                        <Route path="/city" component={Area} />
                        <Route path="/role" component={Role} />
                        <Route path="/login" component={Login} />
                        <Route path="/virtual_account" component={VirtualAccount} />
                        <Route path="/virtual_account_logs" component={VirtualAccountLogs} />
                        <Route path="/subscription_logs" component={SubscriptionLogs} />
                        <Route path="/wallet" component={Wallet} />
                        <Route path="/customer" component={Customer} />
                        <Route path="/top_up" component={TopUp} />
                        <Route path="/my_profile" component={MyProfile} />
                        <Route path="/sender" component={Sender} />
                        <Route path="/subscription" component={Subscription} />
                        <Route path="/forgot_password" component={ForgotPassword} />
                        <Route path="/district" component={District} />
                        <Route path="/help" component={Help} />
                        <Route path="/biller_host" component={BillerHost} />
                        <Route path="/product" component={Product} />
                        <Route path="/product_assignment" component={ProductAssignment} />
                        <Route path="/menu" component={MenuAccount}/>
                        <Route path="/recent_product_uploads" component={ProductUpload} />
                        <Route path="/statistics" component={Statistics} />
                    </div>
                </Router>
            </div>
        )
    }
}

export default Routes;

