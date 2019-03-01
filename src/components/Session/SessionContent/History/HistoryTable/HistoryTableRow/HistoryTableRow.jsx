/*
  This file contains the Effect Card Component.
  It deals with each effect with a nested switch
  statement. This nested switch statement is
  formated as so:

  outside switch: general category (account, signer, trade, trustline)

  inside switch: per category (ie for account have a switch for
                               home domain update, thresholds update, etc.)

  The reasoning behind this design is modularity. If, in the future,
  another effect is added, it simply requires adding another case to
  the switch statement.

  Each case returns an object with the following properties that are then
  placed within a template that is returned and exported:

  1) title: the title of the action, ex: Account Created
  2) attributes: an array of attribute objects related to the effect
    a. header: the attribute label, ex: "STARTING BALANCE: "
    b. value: the attribute value, ex: "2828.292929200"
    c. isAsset(optional): Speficies if the attribute represents an asset.
                          This is used for special formatting within the
                          template including the hover property which is
                          used to show asset cards.
    data. asset_code(optional)
    e. asset_issuer(optional)
    f. domain(optional)
*/
import React from 'react';
import PropTypes from 'prop-types';
import AssetCard2 from '../../../../../AssetCard2';
import HistoryRowExternal from './HistoryRowExternal/HistoryRowExternal';
import { getHistoryRowsData, checkDataType } from './HistoryRowsData';

export default class HistoryTableRow extends React.Component {
    static getHistoryRowAssetCard(code, issuer, domain) {
        return (
            <span className="HistoryView__asset">
                {code}-{domain}
                <div className="HistoryView__asset__card">
                    <AssetCard2 code={code} issuer={issuer} />
                </div>
            </span>
        );
    }

    render() {
        const { data, type } = this.props;
        const { category } = data;
        const dataType = checkDataType(type, category);
        const historyRows = dataType ? getHistoryRowsData(type, data) : [];

        const history = historyRows.attributes.map((row) => {
            const {
                header,
                value,
                isAsset,
                asset_code: code = 'XLM',
                asset_issuer: issuer = null,
                domain,
            } = row;

            const assetCard = isAsset ? HistoryTableRow.getHistoryRowAssetCard(code, issuer, domain) : null;
            return (
                <div key={`${header}${value}`} className="HistoryView__card__line">
                    <span className="HistoryView__card__container__header">{header} </span> {value}
                    {assetCard}
                </div>
            );
        });

        return (
            <div className="HistoryView__card">
                <div className="HistoryView__card__container">
                    <h3 className="HistoryView__card__container__title">{historyRows.title}</h3>

                    {history}
                    <HistoryRowExternal hash={data.transaction_hash} />
                </div>
            </div>
        );
    }
}

HistoryTableRow.propTypes = {
    data: PropTypes.instanceOf(Object).isRequired,
    type: PropTypes.string.isRequired,
};
