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

    getBalance() {
        const isBuy = this.props.side === 'buy';
        const { baseBuying, counterSelling } = this.props.d.orderbook.data;
        const targetAsset = isBuy ? counterSelling : baseBuying;
        const maxOffer = this.calculateMaxOffer();
        const maxOfferView = this.constructor.capDigits(maxOffer);

        return (
            <div>
                <div className="OfferMaker__youHave">
                    {targetAsset.isNative() ?
                        (<span>You may trade up to {maxOfferView} XLM (due to <a href="#account">
                                                               minimum balance requirements</a>.)</span>) :
                        (<span>You have {maxOfferView} {targetAsset.getCode()}</span>)
                    }
                </div>
                {this.isInsufficientBalance() &&
                    <p className="OfferMaker__insufficientBalance">
                        Error: You do not have enough {targetAsset.getCode()} to create this offer.
                    </p>
                }
            </div>
        );
    }
    getInputSummaryMessage() {
        const { valid, amount, total } = this.props.offerState;
        if (!valid) {
            return null;
        }
        const isBuy = this.props.side === 'buy';
        const capitalizedSide = isBuy ? 'Buy' : 'Sell';
        const baseAssetName = this.props.d.orderbook.data.baseBuying.getCode();
        const counterAssetName = this.props.d.orderbook.data.counterSelling.getCode();

        return (
            <div className="s-alert s-alert--info">
                {capitalizedSide} {this.constructor.capDigits(amount)} {baseAssetName} for{' '}
                {this.constructor.capDigits(total)} {counterAssetName}
            </div>
        );
    }

    getResultMessage() {
        const { successMessage, errorMessage, errorType } = this.props.offerState;

        if (successMessage) {
            return (
                <div className="s-alert s-alert--success OfferMaker__message">{successMessage}</div>
            );
        }

        if (errorMessage) {
            switch (errorType) {
            case 'buy_not_authorized':
                return (
                    <div className="s-alert s-alert--alert OfferMaker__message">
                        Unable to create offer because the issuer has not authorized you to trade this asset. To fix
                        this issue, check with the issuer{"'"}s website.
                        <br />
                        <br />
                        NOTE: Some issuers are restrictive in who they authorize.
                    </div>
                );
            case 'op_low_reserve':
                return (
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
            case 'tx_bad_seq':
                return (
                    <div className="s-alert s-alert--alert OfferMaker__message">
                        Transaction failed because sequence got out of sync. Please reload StellarTerm and try again.
                    </div>
                );
            case 'op_underfunded':
                return (
                    <div className="s-alert s-alert--alert OfferMaker__message">
                        Transaction failed due to a lack of funds.
                    </div>
                );
            default:
                return (
                    <div className="s-alert s-alert--alert OfferMaker__message">
                        Failed to create offer.
                        <ul className="OfferMaker__errorList">
                            <li>Error code: {errorType}</li>
                        </ul>
                    </div>
                );
            }
        }
        return null;
    }

    getSubmitButton() {
        const isBuy = this.props.side === 'buy';
        const capitalizedSide = isBuy ? 'Buy' : 'Sell';
        const baseAssetName = this.props.d.orderbook.data.baseBuying.getCode();

        const { valid, buttonState } = this.props.offerState;
        const isButtonReady = buttonState === 'ready';

        return (
            <input
                type="submit"
                className="s-button"
                value={isButtonReady ? `${capitalizedSide} ${baseAssetName}` : 'Creating offer...'}
                disabled={!valid || this.isInsufficientBalance() || !isButtonReady} />
        );
    }

    getTrustNeededAssets() {
        const { baseBuying, counterSelling } = this.props.d.orderbook.data;
        const { account } = this.props.d.session;
        const baseBalance = account.getBalance(baseBuying);
        const counterBalance = account.getBalance(counterSelling);

        const trustNeededAssets = [];
        if (baseBalance === null) {
            trustNeededAssets.push(baseBuying);
        }
        if (counterBalance === null) {
            trustNeededAssets.push(counterSelling);
        }
        return trustNeededAssets;
    }

    calculateMaxOffer() {
        const isBuy = this.props.side === 'buy';
        const { baseBuying, counterSelling } = this.props.d.orderbook.data;
        const targetAsset = isBuy ? counterSelling : baseBuying;

        const { account } = this.props.d.session;
        const maxLumenSpend = account.maxLumenSpend();

        const targetBalance = targetAsset.isNative() ? maxLumenSpend : account.getBalance(targetAsset);
        const reservedBalance = account.getReservedBalance(targetAsset);

        return (parseFloat(targetBalance) > parseFloat(reservedBalance)) ?
            targetBalance - reservedBalance : 0;
    }

    isInsufficientBalance() {
        const isBuy = this.props.side === 'buy';
        const maxOffer = this.calculateMaxOffer();
        const { amount, total } = this.props.offerState;

        return Number(isBuy ? total : amount) > Number(maxOffer);
    }

    render() {
        const login = this.props.d.session.state === 'in';

        if (!login) {
            return (
                <div>
                    {this.getInputSummaryMessage()}
                    <span className="OfferMaker__message">
                        <a href="#account">Log in</a> to create an offer
                    </span>
                </div>
            );
        }

        const trustNeededAssets = this.getTrustNeededAssets();

        if (trustNeededAssets.length) {
            return (
                <div>
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
                </div>
            );
        }
        return (
            <div className="OfferMaker__overview">
                {this.getBalance()}
                {this.getInputSummaryMessage()}
                {this.getResultMessage()}
                {this.getSubmitButton()}
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
