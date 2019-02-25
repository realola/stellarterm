/*
  This file contains the Effects History Component.
  This component is the parent of the Effects History
  Table Component: HistoryTable.jsx. It has checkboxes
  used to filter effects.
*/
import React from 'react';
import PropTypes from 'prop-types';
import HistoryTable from './HistoryTable';
import Driver from '../../lib/Driver';

export default class HistoryView extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            trade: true,
            account: true,
            signer: true,
            trustline: true,
        };

        this.props.d.history.handlers.touch();
        this.listenId = this.props.d.history.event.listen(() => {
            this.forceUpdate();
        });
    }

    componentWillUnmount() {
        this.props.d.history.event.unlisten(this.listenId);
    }

    getFilterButtons() {
        // todo: write onClick handler in one line. Try to improve className logic?
        return (
            <div className="s-buttonGroup HistoryView__header__right__buttonGroup">
                <button
                    className={`s-button s-button--light${this.state.trade ? ' is-active' : ''}`}
                    onClick={() => {
                        this.updateFilter('trade');
                    }}>
                    Trade
                </button>
                <button
                    className={`s-button s-button--light${this.state.account ? ' is-active' : ''}`}
                    onClick={() => {
                        this.updateFilter('account');
                    }}>
                    Account
                </button>
                <button
                    className={`s-button s-button--light${this.state.signer ? ' is-active' : ''}`}
                    onClick={() => {
                        this.updateFilter('signer');
                    }}>
                    Signer
                </button>
                <button
                    className={`s-button s-button--light${this.state.trustline ? ' is-active' : ''}`}
                    onClick={() => {
                        this.updateFilter('trustline');
                    }}>
                    Trustline
                </button>
            </div>
        );
    }

    updateFilter(name) {
        this.setState({ [name]: !this.state[name] });
    }

    render() {
        const filterToggles = this.getFilterButtons();

        return (
            <div className="so-back islandBack islandBack--t">
                <div className="island">
                    <div className="island__header">
                        <div className="HistoryView__header">
                            <div className="HistoryView__header__left">Account History</div>
                            <div className="HistoryView__header__right">
                                <span className="HistoryView__header__right__label">Filter: </span>
                                {filterToggles}
                            </div>
                        </div>
                    </div>

                    <HistoryTable d={this.props.d} filters={this.state} />
                </div>
            </div>
        );
    }
}

HistoryView.propTypes = {
    d: PropTypes.instanceOf(Driver).isRequired,
};
