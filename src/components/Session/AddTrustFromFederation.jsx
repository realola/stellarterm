import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import AddTrustRow from './AddTrustRow';
import Stellarify from '../../lib/Stellarify';
import MessageRow from '../MessageRow';
import ErrorRow from '../ErrorRow';
import Driver from '../../lib/Driver';

export default class AddTrustFromFederation extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            federation: '',
            currencies: [],
            state: 'initial', // States: initial, pending, found, notfound
        };

        this.handleInputFederation = (event) => {
            const fedValue = event.target.value;
            this.setState({
                federation: fedValue,
                state: 'pending',
                currencies: [],
            });

            StellarSdk.StellarTomlResolver.resolve(fedValue)
                .then((res) => {
                    if (fedValue !== this.state.federation) {
                        return;
                    }
                    this.setState({
                        federation: fedValue,
                        state: 'found',
                        currencies: res.CURRENCIES,
                    });
                })
                .catch(() => {
                    if (fedValue !== this.state.federation) {
                        return;
                    }
                    this.setState({
                        federation: fedValue,
                        state: 'notfound',
                        currencies: [],
                    });
                });
        };
    }

    render() {
        let results;
        if (this.state.state === 'pending') {
            results = <MessageRow>Loading currencies for {this.state.federation}...</MessageRow>;
        } else if (this.state.state === 'notfound') {
            results = <ErrorRow>Unable to find currencies for {this.state.federation}</ErrorRow>;
        } else if (this.state.state === 'found') {
            results = _.map(this.state.currencies, (currency) => {
                const asset = Stellarify.assetToml(currency);
                const key = currency.code + currency.issuer;
                return <AddTrustRow key={key} d={this.props.d} asset={asset} />;
            });
        }

        return (
            <div className="island">
                <div className="island__header">Accept asset via anchor domain</div>
                <div className="island__paddedContent">
                    <p>You can accept an asset by entering the domain name of the issuer.</p>
                    <label className="s-inputGroup AddTrust__inputGroup" htmlFor="anchorDomainInput">
                        <span className="s-inputGroup__item s-inputGroup__item--tag S-flexItem-1of4">
                            <span>Anchor Domain</span>
                        </span>
                        <input
                            className="s-inputGroup__item S-flexItem-share"
                            type="text"
                            name="anchorDomainInput"
                            value={this.state.federation}
                            onChange={this.handleInputFederation}
                            placeholder="example: sureremit.co" />
                    </label>
                </div>
                {results}
            </div>
        );
    }
}

AddTrustFromFederation.propTypes = {
    d: PropTypes.instanceOf(Driver).isRequired,
};
