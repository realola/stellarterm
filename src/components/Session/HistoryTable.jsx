/*
  This file contains the Effects History Table Component.
  This component displays relevant information about all the effects of an account in descending chronological order.
  It is meant to be visual, concise, scanable, minimal, and clean, with two columns:
  1) Description
  2) Date (date, absolute time, and ledger sequence number)
*/
import React from 'react';
import PropTypes from 'prop-types';
import HistoryTableRow from './HistoryTableRow';
import Loading from '../Loading';
// todo: refactor lib/Format
import { niceDate } from '../../lib/Format';
import Driver from '../../lib/Driver';

export default class HistoryTable extends React.Component {
    render() {
        const spoonHistory = this.props.d.history.spoonHistory;
        // todo: isNoHistory --> historyNotLoaded
        const isNoHistory = spoonHistory === null;

        if (isNoHistory) {
            return <Loading size="large">Loading transaction history...</Loading>;
        }

        const totalRecords = spoonHistory.records.length;
        let loadedRecords = 0;

        // todo: move getting historyRows() to separate method, get rid of loadedRecords
        const historyRows = spoonHistory.records.map((record) => {
            const details = spoonHistory.details[record.id];
            // todo: improve filters check
            const detailsIsUndefined = details === undefined || !this.props.filters[record.type.split('_')[0]];
            // todo: linter fix
            if (detailsIsUndefined) return null;

            const effectType = details.category.split('_')[0];
            // todo: destruct niceDateObj
            const niceDateObj = niceDate(details.created_at);
            loadedRecords += 1;

            return (
                <tr className="HistoryTable__row" key={details.id}>
                    <td className="HistoryTable__row__item--description">
                        <HistoryTableRow type={effectType} data={details} />
                    </td>
                    <td className="HistoryTable__row__item--date">
                        <div className="DateCard">
                            <div className="DateCard__date">
                                {niceDateObj.date}
                                <br />
                                {niceDateObj.time}
                                <br />
                                {niceDateObj.timezone}
                            </div>
                            <div className="DateCard__ledger">Ledger #{details.ledger_attr}</div>
                        </div>
                    </td>
                </tr>
            );
        });

        return (
            <table className="HistoryTable">
                <thead>
                    <tr className="HistoryTable__head">
                        <td className="HistoryTable__head__cell HistoryTable__head__description">Description</td>
                        <td className="HistoryTable__head__cell HistoryTable__head__date">Date</td>
                    </tr>
                </thead>

                <tbody className="HistoryTable__body">
                    {historyRows}

                    <tr className="HistoryTable__row HistoryTable__row__loading" key={'loading'}>
                        <td>
                            Loading ({loadedRecords}/{totalRecords})
                        </td>
                    </tr>
                </tbody>
            </table>
        );
    }
}

HistoryTable.propTypes = {
    d: PropTypes.instanceOf(Driver).isRequired,
    filters: PropTypes.objectOf(PropTypes.bool).isRequired,
};
