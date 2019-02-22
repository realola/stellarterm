import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import AssetCard from '../AssetCard';
import Driver from '../../lib/Driver';

export default class ManuallyAddTrust extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            status: 'ready', // 'ready' | 'working'
            trustCode: '',
            trustIssuer: '',
        };

        this.handleInputTrustCode = (event) => {
            this.setState({
                status: 'ready',
                trustCode: event.target.value,
            });
        };

        this.handleInputTrustIssuer = (event) => {
            this.setState({
                status: 'ready',
                trustIssuer: event.target.value,
            });
        };

        this.handleSubmitTrust = (event) => {
            event.preventDefault();
            this.props.d.session.handlers.addTrust(this.state.trustCode, this.state.trustIssuer).then((bssResult) => {
                if (bssResult.status === 'finish') {
                    this.setState({ status: 'working' });
                    return bssResult.serverResult
                        .then(() => {
                            this.setState({ status: 'ready' });
                        })
                        .catch((error) => {
                            console.log(error);
                            this.setState({ status: 'ready' });
                        });
                }
                return null;
            });
        };
    }

    render() {
        let confirmation;
        if (this.state.trustCode !== '' && this.state.trustIssuer !== '') {
            const errors = [];
            const trustCode = this.state.trustCode;
            if (trustCode.length > 12) {
                errors.push('Asset code must be 12 or fewer characters');
            }
            if (!trustCode.match(/^[a-zA-Z0-9]+$/g)) {
                errors.push('Asset code must contain only letters and/or numbers');
            }
            if (!StellarSdk.StrKey.isValidEd25519PublicKey(this.state.trustIssuer)) {
                errors.push('Asset issuer account ID must be a valid account ID');
            }

            if (errors.length) {
                confirmation = (
                    <div>
                        <div className="island__separator" />
                        <div className="AddTrust__confirmation">
                            <div className="s-alert s-alert--alert">
                                <ul className="AddTrust__errorList">
                                    {_.map(errors, (errorMessage, index) => (
                                        <li key={index}>{errorMessage}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                );
            } else {
                let found = false;
                _.each(this.props.d.session.account.balances, (balance) => {
                    if (
                        balance.asset_code === this.state.trustCode &&
                        balance.asset_issuer === this.state.trustIssuer
                    ) {
                        found = true;
                    }
                });

                let createButton;
                if (found) {
                    createButton = (
                        <button disabled className="s-button">
                            Already accepting {this.state.trustCode}
                        </button>
                    );
                } else if (this.state.status === 'working') {
                    createButton = (
                        <button
                            disabled
                            className="s-button"
                            onClick={(e) => {
                                this.handleSubmitTrust(e);
                            }}>
                            Accepting asset {this.state.trustCode}...
                        </button>
                    );
                } else {
                    createButton = (
                        <button
                            className="s-button"
                            onClick={(e) => {
                                this.handleSubmitTrust(e);
                            }}>
                            Accept asset {this.state.trustCode}
                        </button>
                    );
                }

                const asset = new StellarSdk.Asset(this.state.trustCode, this.state.trustIssuer);
                confirmation = (
                    <div>
                        <div className="island__separator" />
                        <div className="AddTrust__confirmation">
                            <div className="AddTrust__confirmation__assetCard">
                                <AssetCard asset={asset} fixed />
                            </div>
                            {createButton}
                        </div>
                    </div>
                );
            }
        }

        return (
            <div className="island">
                <div className="island__header">Manually accept asset</div>
                <div className="island__paddedContent">
                    <p>You can accept an asset if you know the issuer account ID and asset code.</p>
                    <label className="s-inputGroup AddTrust__inputGroup" htmlFor="inputManuallyAssetCode">
                        <span className="s-inputGroup__item s-inputGroup__item--tag S-flexItem-1of4">
                            <span>Asset Code</span>
                        </span>

                        <input
                            className="s-inputGroup__item S-flexItem-share"
                            name="inputManuallyAssetCode"
                            type="text"
                            value={this.state.trustCode}
                            onChange={this.handleInputTrustCode}
                            placeholder="Asset code (example: BTC)" />
                    </label>

                    <label className="s-inputGroup AddTrust__inputGroup" htmlFor="inputManuallyIssuer">
                        <span className="s-inputGroup__item s-inputGroup__item--tag S-flexItem-1of4">
                            <span>Issuer Account ID</span>
                        </span>

                        <input
                            className="s-inputGroup__item S-flexItem-share"
                            name="inputManuallyIssuer"
                            type="text"
                            value={this.state.trustIssuer}
                            onChange={this.handleInputTrustIssuer}
                            placeholder="Asset Issuer
                            (example: GC4DJYMFQZVX3R56FVCN3WA7FJFKT24VI67ODTZUENSE4YNUXZ3WYI7R)" />
                    </label>
                </div>
                {confirmation}
            </div>
        );
    }
}

ManuallyAddTrust.propTypes = {
    d: PropTypes.instanceOf(Driver).isRequired,
};
