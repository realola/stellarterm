import React from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import TrustButton from './Session/TrustButton';
import Driver from '../lib/Driver';

// OfferMaker is an uncontrolled element (from the perspective of its users)
export default class OfferMaker extends React.Component {
    static capDigits(input) {
        try {
            return new BigNumber(input).toFixed(7).toString();
        } catch (e) {
            return input;
        }
    }

    constructor(props) {
        super(props);
        this.initialized = false;

        this.orderbookUnsub = this.props.d.orderbook.event.sub((data) => {
            if (data && data.pickPrice) {
                this.updateState('price', data.pickPrice);
            }
        });
        this.sessionUnsub = this.props.d.session.event.sub(() => {
            this.forceUpdate();
        });

        this.state = {
            valid: false,
            price: '', // Most sticky item (since the price is pretty static)
            amount: '',

            // Total = price * amount
            total: '',
            buttonState: 'ready', // ready or pending
            errorMessage: false,
            successMessage: '',
        };

        if (this.props.d.orderbook.data.ready) {
            this.state = Object.assign(this.state, this.initialize());
        }
    }

    componentWillUnmount() {
        this.orderbookUnsub();
        this.sessionUnsub();
    }

    initialize() {
        if (!this.initialized) {
            this.initialized = true;
            const state = {};

            // Initialize price
            if (this.props.side === 'buy' && this.props.d.orderbook.data.bids.length > 0) {
                state.price = new BigNumber(this.props.d.orderbook.data.bids[0].price).toString();
                // Get rid of extra 0s
            } else if (this.props.d.orderbook.data.asks.length > 0) {
                // Proptypes validation makes sure this is sell
                state.price = new BigNumber(this.props.d.orderbook.data.asks[0].price).toString();
                // Get rid of extra 0s
            }

            state.errorType = '';

            return state;
        }
        return {};
    }

    // TODO: Limit the number of digits after the decimal that can be input
    updateState(item, value) {
        const state = Object.assign(this.state, {
            // Reset messages
            successMessage: '',
            errorMessage: false,
        });
        state.valid = false;
        if (item === 'price' || item === 'amount' || item === 'total') {
            state[item] = value;
        } else {
            throw new Error('Invalid item type');
        }

        try {
          // If there is an error, we will just let the user input change but not the affected inputs
            if (item === 'price' || item === 'amount') {
                const changeValueType = item === 'price' ? 'amount' : 'price';
                state.total = new BigNumber(
                    new BigNumber(value).times(new BigNumber(state[changeValueType])).toFixed(7),
                ).toString();
            } else if (item === 'total') {
                state.amount = new BigNumber(
                    new BigNumber(value).dividedBy(new BigNumber(state.price)).toFixed(7),
                ).toString();
            } else {
                throw new Error('Invalid item type');
            }

            // TODO: truer valid
            state.valid = true;
        } catch (e) {
            // Invalid input somewhere
        }
        this.setState(state);
    }

    handleSubmit(e) {
        // TODO: Hook up with driver
        e.preventDefault();
        this.props.d.session.handlers
            .createOffer(this.props.side, {
                price: this.state.price,
                amount: this.state.amount,
                total: this.state.total,
            })
            .then((signAndSubmitResult) => {
                if (signAndSubmitResult.status === 'finish') {
                    this.setState({
                        valid: false,
                        buttonState: 'pending',
                        amount: '',
                        total: '',
                        successMessage: '',
                        errorMessage: false,
                    });

                    signAndSubmitResult.serverResult
                        .then(() => {
                            this.setState({
                                buttonState: 'ready',
                                successMessage: 'Offer successfully created',
                            });
                        })
                        .catch((result) => {
                            let errorType;
                            try {
                                if (result.data === undefined) {
                                    errorType = `clientError - ${result.message}`;
                                } else if (result.data && result.data.extras) {
                                    if (result.data.extras.result_codes.operations === undefined) {
                                        errorType = result.data.extras.result_codes.transaction;
                                    } else {
                                        // Common errors:
                                        // errorType = 'buy_not_authorized'
                                        // errorType = 'op_low_reserve'
                                        errorType = result.data.extras.result_codes.operations[0];
                                    }
                                } else {
                                    errorType = `unknownResponse - ${e.message}`;
                                }
                            } catch (error) {
                                console.error(error);
                                errorType = `unknownResponse - ${e.message}`;
                            }

                            this.setState({
                                buttonState: 'ready',
                                errorMessage: true,
                                errorType,
                            });
                        });
                }
            });
    }

    renderTableRow(inputType, assetName) {
        return (
            <tr className="OfferMaker__table__row">
                <td className="OfferMaker__table__label">{inputType}</td>
                <td className="OfferMaker__table__input">
                    <label className="OfferMaker__table__input__group" htmlFor={inputType}>
                        <input
                            type="text"
                            name={inputType}
                            className="OfferMaker__table__input__input"
                            value={this.state[inputType]}
                            onChange={e => this.updateState(inputType, e.target.value)}
                            placeholder="" />
                        <div className="OfferMaker__table__input__group__tag">{assetName}</div>
                    </label>
                </td>
            </tr>
        );
    }

    render() {
        if (!this.props.d.orderbook.data.ready) {
            return <div>Loading</div>;
        }

        const isBuy = this.props.side === 'buy';
        const login = this.props.d.session.state === 'in';
        const { baseBuying, counterSelling } = this.props.d.orderbook.data;

        const capitalizedSide = isBuy ? 'Buy' : 'Sell';
        const baseAssetName = baseBuying.getCode();
        const counterAssetName = counterSelling.getCode();
        const title = isBuy ?
            `Buy ${baseAssetName} using ${counterAssetName}` :
            `Sell ${baseAssetName} for ${counterAssetName}`;

        let youHave;

        let insufficientBalanceMessage;
        const trustNeededAssets = [];

        if (login) {
            const baseBalance = this.props.d.session.account.getBalance(baseBuying);
            const counterBalance = this.props.d.session.account.getBalance(counterSelling);

            if (baseBalance === null) {
                trustNeededAssets.push(baseBuying);
            }
            if (counterBalance === null) {
                trustNeededAssets.push(counterSelling);
            }

            const targetBalance = isBuy ? counterBalance : baseBalance;
            const targetAsset = isBuy ? counterSelling : baseBuying;

            const reservedBalance = this.props.d.session.account.getReservedBalance(targetAsset);


            const inputSpendAmount = isBuy ? this.state.total : this.state.amount;
            let maxOffer = targetBalance - reservedBalance;
            if (targetAsset.isNative()) {
                const maxLumenSpend = this.props.d.session.account.maxLumenSpend();
                maxOffer = (maxLumenSpend > reservedBalance) ? maxLumenSpend - reservedBalance : 0;

                youHave = (
                    <div className="OfferMaker__youHave">
                        You may trade up to {maxOffer} XLM (due to{' '}
                        <a href="#account">minimum balance requirements</a>).
                    </div>
                    );
            } else {
                youHave = (
                    <div className="OfferMaker__youHave">
                        You have {maxOffer} {targetAsset.getCode()}
                    </div>
                    );
            }
            if (Number(inputSpendAmount) > Number(maxOffer)) {
                insufficientBalanceMessage = (
                    <p className="OfferMaker__insufficientBalance">
                        Error: You do not have enough {targetAsset.getCode()} to create this offer.
                    </p>
                );
            }
        }

        let submit;

        if (login) {
            if (this.state.buttonState === 'ready') {
                submit = (
                    <input
                        type="submit"
                        className="s-button"
                        value={`${capitalizedSide} ${baseAssetName}`}
                        disabled={!this.state.valid || insufficientBalanceMessage} />
                );
            } else {
                submit = <input type="submit" className="s-button" disabled value="Creating offer..." />;
            }
        } else {
            submit = (
                <span className="OfferMaker__message">
                    <a href="#account">Log in</a> to create an offer
                </span>
            );
        }

        let summary;
        if (this.state.valid) {
            if (isBuy) {
                summary = (
                    <div className="s-alert s-alert--info">
                        Buy {this.state.amount} {this.constructor.capDigits(baseAssetName)} for{' '}
                        {this.constructor.capDigits(this.state.total)} {counterAssetName}
                    </div>
                );
            } else {
                summary = (
                    <div className="s-alert s-alert--info">
                        Sell {this.state.amount} {this.constructor.capDigits(baseAssetName)} for{' '}
                        {this.constructor.capDigits(this.state.total)} {counterAssetName}
                    </div>
                );
            }
        }

        let error;
        if (this.state.errorMessage) {
            if (this.state.errorType === 'buy_not_authorized') {
                error = (
                    <div className="s-alert s-alert--alert OfferMaker__message">
                        Unable to create offer because the issuer has not authorized you to trade this asset. To fix
                        this issue, check with the issuer{"'"}s website.
                        <br />
                        <br />
                        NOTE: Some issuers are restrictive in who they authorize.
                    </div>
                );
            } else if (this.state.errorType === 'op_low_reserve') {
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
            } else if (this.state.errorType === 'tx_bad_seq') {
                error = (
                    <div className="s-alert s-alert--alert OfferMaker__message">
                        Transaction failed because sequence got out of sync. Please reload StellarTerm and try again.
                    </div>
                );
            } else {
                error = (
                    <div className="s-alert s-alert--alert OfferMaker__message">
                        Failed to create offer.
                        <ul className="OfferMaker__errorList">
                            <li>Error code: {this.state.errorType}</li>
                        </ul>
                    </div>
                );
            }
        }

        let success;
        if (this.state.successMessage !== '') {
            success = <div className="s-alert s-alert--success OfferMaker__message">{this.state.successMessage}</div>;
        }

        let overview;

        if (login && trustNeededAssets.length) {
            overview = (
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
        } else {
            overview = (
                <div className="OfferMaker__overview">
                    {youHave}
                    {insufficientBalanceMessage}
                    {summary}
                    {error}
                    {success}
                    {submit}
                </div>
            );
        }

        return (
            <div>
                <h3 className="island__sub__division__title island__sub__division__title--left">{title}</h3>
                <form onSubmit={this.handleSubmit}>
                    <table className="OfferMaker__table">
                        <tbody>
                            {this.renderTableRow('price', counterAssetName)}
                            {this.renderTableRow('amount', baseAssetName)}
                            {this.renderTableRow('total', counterAssetName)}
                        </tbody>
                    </table>
                    {overview}
                </form>
            </div>
        );
    }
}

OfferMaker.propTypes = {
    side: PropTypes.oneOf(['buy', 'sell']).isRequired,
    d: PropTypes.instanceOf(Driver).isRequired,
};
