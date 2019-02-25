import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import Driver from '../../lib/Driver';
import MinBalanceDescription from './MinBalanceDescription';

export default function MinBalance(props) {
    const explanation = props.d.session.account.explainReserve();

    // todo: destruct item, use entryType as key
    const minBalanceRows = _.map(explanation.items, (item, index) => (
        <tr key={index}>
            <td className="MinBalance__table__type">{item.entryType}</td>
            <td>{item.amount}</td>
            <td className="MinBalance__table__lumens">{item.XLM}</td>
        </tr>
    ));

    // todo: move to return?
    minBalanceRows.push(
        <tr key={-1} className="MinBalance__table__total">
            <td className="MinBalance__table__type">
                <strong>Total</strong>
            </td>
            <td />
            <td className="MinBalance__table__lumens">
                <strong>{explanation.totalLumens}</strong>
            </td>
        </tr>,
    );

    return (
        <div>
            <div className="island__sub">
                <MinBalanceDescription />

                <div className="island__sub__division MinBalance__sub MinBalance__sub--table">
                    <table className="MinBalance__table">
                        <thead className="MinBalance__table__head">
                            <tr>
                                <td className="MinBalance__table__type">Entry type</td>
                                <td>#</td>
                                <td className="MinBalance__table__lumens">XLM</td>
                            </tr>
                        </thead>

                        <tbody>{minBalanceRows}</tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

MinBalance.propTypes = {
    d: PropTypes.instanceOf(Driver).isRequired,
};
