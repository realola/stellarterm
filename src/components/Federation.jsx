import React from 'react';
import images from '../images';

export default function Federation(props) {
    return (
        <div className="Session__federations__block">
            <div className="s-alert s-alert--primary">
                <p className="Session__federations__alert">
                    <span>StellarTerm federation address</span>
                    <button className="s-button Session__federations__button">Enable</button>
                </p>
            </div>
            <div className="Session__Account__text">
                <p className="federation-warning">
                    <img src={images.error} className="federation-icon" alt="Error" />
                    <span className="federations-warning-text">This federation address is already in use. Please choose a different alias.</span>
                </p>

                <p>
                    You can set an alias for your StellarTerm account. We’ll use this in our trollbox, and it will
                    become your payment alias, so people can send you money more easily. You can use this alias,
                    including the*stellarx.com, instead of your public key to receive payments on Stellar.
                </p>
            </div>
        </div>
    );
}
