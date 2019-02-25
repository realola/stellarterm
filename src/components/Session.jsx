import React from 'react';
import PropTypes from 'prop-types';

import LoginPage from './Session/LoginPage/LoginPage';
import Driver from '../lib/Driver';
import SessionActivateAccount from './Session/SessionActivateAccount';
import SessionLoading from './Session/SessionLoading';
import SessionWelcome from './Session/SessionWelcome';
import SessionPageContent from './Session/SessionPageContent';

export default class Session extends React.Component {
    constructor(props) {
        super(props);
        this.listenId = this.props.d.session.event.listen(() => {
            this.forceUpdate();
        });
        // todo: do we need mounted property?
        this.mounted = true;
    }

    componentWillUnmount() {
        this.mounted = false;
        this.props.d.session.event.unlisten(this.listenId);
    }

    render() {
        const { d, urlParts } = this.props;
        // todo: destruct d.session (unfundedAccountId, state, inflationDone)
        const state = d.session.state;

        switch (state) {
        case 'out':
            return <LoginPage d={d} urlParts={urlParts} />;
        case 'unfunded':
            return <SessionActivateAccount unfundedAccountId={d.session.unfundedAccountId} />;
        case 'loading':
            return <SessionLoading />;
        case 'in':
            if (!d.session.inflationDone) {
                return <SessionWelcome d={d} />;
            }
            return <SessionPageContent d={d} urlParts={urlParts} />;
        default:
            break;
        }
        return null;
    }
}

Session.propTypes = {
    d: PropTypes.instanceOf(Driver).isRequired,
    urlParts: PropTypes.arrayOf(PropTypes.string),
};
