import React from 'react';
import PropTypes from 'prop-types';
import Driver from '../../lib/Driver';
import Ellipsis from '../Ellipsis';

export default class RemoveTrustLink extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            status: 'ready', // Can be: ready, pending, or error
        };

        // TODO: If we successfully remove trust, then React gets unhappy because this element disappears
        // Warning: Can only update a mounted or mounting component. This usually means you called setState,
        // replaceState, or forceUpdate on an unmounted component.This is a no - op.
        // Please check the code for the BalancesTable component.
    }

    handleRemoveTrust(e) {
        e.preventDefault();
        this.props.d.session.handlers
        // todo: destruct this.props.balance
            .removeTrust(this.props.balance.code, this.props.balance.issuer)
            // todo: destruct bssResult, revert condition
            .then((bssResult) => {
                if (bssResult.status === 'finish') {
                    this.setState({ status: 'pending' });
                    return bssResult.serverResult
                        .then((res) => {
                            console.log('Successfully removed trust', res);
                        })
                        .catch((err) => {
                            console.log('Errored when removing trust', err);
                            this.setState({
                                status: 'error',
                            });
                        });
                }
                return null;
            });
    }

    render() {
        // todo: destruct props.balance
        const balance = this.props.balance;
        const status = this.state.status;
        const balanceIsZero = balance.balance === '0.0000000';

        if (!balanceIsZero) {
            return <span className="BalancesTable__row__removeLink"> Asset can be removed when balance is 0</span>;
        }

        if (status === 'ready') {
            return (
                <a className="BalancesTable__row__removeLink" onClick={e => this.handleRemoveTrust(e)}>
                    Remove asset
                </a>
            );
        } else if (status === 'pending') {
            return (
                <span className="BalancesTable__row__removeLink">
                    Removing asset
                    <Ellipsis />
                </span>
            );
        }
        return (
            <a className="BalancesTable__row__removeLink" onClick={e => this.handleRemoveTrust(e)}>
                Errored when removing asset
            </a>
        );
    }
}

RemoveTrustLink.propTypes = {
    d: PropTypes.instanceOf(Driver).isRequired,
    balance: PropTypes.objectOf(PropTypes.string).isRequired,
};
