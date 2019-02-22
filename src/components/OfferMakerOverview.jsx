import React from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import TrustButton from './Session/TrustButton';
import Driver from '../lib/Driver';

export default class OfferMakerOverview extends React.Component {
    static capDigits(input) {
        try {
            return new BigNumber(input).toFixed(7).toString();
        } catch (e) {
            return input;
        }
    }
    render() {
        const isBuy = this.props.side === 'buy';
        const login = this.props.d.session.state === 'in';
        const { baseBuying, counterSelling } = this.props.d.orderbook.data;

        const capitalizedSide = isBuy ? 'Buy' : 'Sell';
        const baseAssetName = baseBuying.getCode();
        const counterAssetName = counterSelling.getCode();

        let youHave;
        let insufficientBalanceMessage;
        const trustNeededAssets = [];

        if (login) {
            const maxLumenSpend = this.props.d.session.account.maxLumenSpend();

            const baseBalance = baseBuying.isNative() ?
                maxLumenSpend : this.props.d.session.account.getBalance(baseBuying);
            const counterBalance = counterSelling.isNative() ?
                maxLumenSpend : this.props.d.session.account.getBalance(counterSelling);

            if (baseBalance === null) {
                trustNeededAssets.push(baseBuying);
            }
            if (counterBalance === null) {
                trustNeededAssets.push(counterSelling);
            }


            const targetAsset = isBuy ? counterSelling : baseBuying;
            const targetBalance = isBuy ? counterBalance : baseBalance;

            const reservedBalance = this.props.d.session.account.getReservedBalance(targetAsset);
            const maxOffer = (parseFloat(targetBalance) > parseFloat(reservedBalance)) ?
                targetBalance - reservedBalance : 0;

            youHave = (
                <div className="OfferMaker__youHave">
                    {targetAsset.isNative() ?
                        (<span>You may trade up to {maxOffer} XLM (due to <a href="#account">
                         minimum balance requirements</a>.)</span>) :
                        (`You have ${maxOffer} ${targetAsset.getCode()}`)
                    }
                </div>
            );

            const inputSpendAmount = isBuy ? this.props.offerState.total : this.props.offerState.amount;

            if (Number(inputSpendAmount) > Number(maxOffer)) {
                insufficientBalanceMessage = (
                    <p className="OfferMaker__insufficientBalance">
                      Error: You do not have enough {targetAsset.getCode()} to create this offer.
                    </p>
                );
            }
        }

        const isButtonReady = this.props.offerState.buttonState === 'ready';

        const submit = login ?
            (<input
                type="submit"
                className="s-button"
                value={isButtonReady ? `${capitalizedSide} ${baseAssetName}` : 'Creating offer...'}
                disabled={!this.props.offerState.valid || insufficientBalanceMessage || !isButtonReady} />) :
            (<span className="OfferMaker__message">
                <a href="#account">Log in</a> to create an offer
            </span>);


        const summary = this.props.offerState.valid && (
            <div className="s-alert s-alert--info">
                {capitalizedSide} {this.props.offerState.amount} {this.constructor.capDigits(baseAssetName)} for{' '}
                {this.constructor.capDigits(this.props.offerState.total)} {counterAssetName}
            </div>
        );


        let error;
        if (this.props.offerState.errorMessage) {
            switch (this.props.offerState.errorType) {
            case 'buy_not_authorized':
                error = (
                    <div className="s-alert s-alert--alert OfferMaker__message">
                        Unable to create offer because the issuer has not authorized you to trade this asset. To fix
                        this issue, check with the issuer{"'"}s website.
                        <br />
                        <br />
                        NOTE: Some issuers are restrictive in who they authorize.
                    </div>
                );
                break;
            case 'op_low_reserve':
                error = (
                    <div className="s-alert s-alert--alert OfferMaker__message">
                        Your account does not have enough XLM to meet the{' '}
                        <a
                            href="https://www.stellar.org/developers/guides/concepts/fees.html#minimum-account-balance"
                            target="_blank"
                            rel="nofollow noopener noreferrer">
                          minimum balance
                        </a>
                        . For more info, see <a href="#account">the minimum balance section</a> of the account page.
                        <br />
                        <br />
                        Solutions:
                        <ul className="OfferMaker__errorList">
                            <li>Send at least 1 XLM to your account</li>
                            <li>Cancel an existing an offer</li>
                            <li>
                                Decrease your minimum balance by <a href="#account/addTrust">unaccepting an asset</a>
                            </li>
                        </ul>
                    </div>
                );
                break;
            case 'tx_bad_seq':
                error = (
                    <div className="s-alert s-alert--alert OfferMaker__message">
                        Transaction failed because sequence got out of sync. Please reload StellarTerm and try again.
                    </div>
                );
                break;
            default:
                error = (
                    <div className="s-alert s-alert--alert OfferMaker__message">
                        Failed to create offer.
                        <ul className="OfferMaker__errorList">
                           <li>Error code: {this.props.offerState.errorType}</li>
                        </ul>
                    </div>
                );
            }
        }

        const success = this.props.offerState.successMessage && (
            <div className="s-alert s-alert--success OfferMaker__message">{this.props.offerState.successMessage}</div>
        );

        const overview = trustNeededAssets.length ?
            (<div>
                <p className="OfferMaker__enable">To trade, activate these assets on your account:</p>
                <div className="row__multipleButtons">
                    {trustNeededAssets.map(asset => (
                        <TrustButton
                            key={`${asset.getCode()}-${asset.getIssuer()}`}
                            d={this.props.d}
                            asset={asset}
                            message={`${asset.getCode()} accepted`}
                            trustMessage={`Accept ${asset.getCode()}`} />
                    ))}
                </div>
            </div>) :
            (<div className="OfferMaker__overview">
                {youHave}
                {insufficientBalanceMessage}
                {summary}
                {error}
                {success}
                {submit}
            </div>);
        return (
            <div>
                { overview }
            </div>
        );
    }
}
OfferMakerOverview.propTypes = {
    side: PropTypes.oneOf(['buy', 'sell']).isRequired,
    d: PropTypes.instanceOf(Driver).isRequired,
    offerState: PropTypes.shape({
        valid: PropTypes.bool,
        amount: PropTypes.string,
        total: PropTypes.string,
        buttonState: PropTypes.oneOf(['ready', 'pending']),
        errorMessage: PropTypes.bool,
        errorType: PropTypes.string,
        successMessage: PropTypes.string,
    }).isRequired,
};
