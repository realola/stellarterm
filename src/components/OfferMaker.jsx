import React from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import Driver from '../lib/Driver';
import OfferMakerOverview from './OfferMakerOverview';

// OfferMaker is an uncontrolled element (from the perspective of its users)
export default class OfferMaker extends React.Component {
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

    handleSubmit(e, props) {
        // TODO: Hook up with driver
        e.preventDefault();
        props.d.session.handlers
            .createOffer(props.side, {
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
        const { baseBuying, counterSelling } = this.props.d.orderbook.data;
        const baseAssetName = baseBuying.getCode();
        const counterAssetName = counterSelling.getCode();
        const title = isBuy ?
            `Buy ${baseAssetName} using ${counterAssetName}` :
            `Sell ${baseAssetName} for ${counterAssetName}`;
        return (
            <div>
                <h3 className="island__sub__division__title island__sub__division__title--left">{title}</h3>
                <form onSubmit={e => this.handleSubmit(e, this.props)}>
                    <table className="OfferMaker__table">
                        <tbody>
                            {this.renderTableRow('price', counterAssetName)}
                            {this.renderTableRow('amount', baseAssetName)}
                            {this.renderTableRow('total', counterAssetName)}
                        </tbody>
                    </table>

                    <OfferMakerOverview
                        d={this.props.d}
                        side={this.props.side}
                        offerState={this.state} />
                </form>
            </div>
        );
    }
}

OfferMaker.propTypes = {
    side: PropTypes.oneOf(['buy', 'sell']).isRequired,
    d: PropTypes.instanceOf(Driver).isRequired,
};
