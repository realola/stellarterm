import React from 'react';

export default function Federation(props) {
    return (
        <div className="Session__federations__block">
            <div className="s-alert s-alert--primary">
                <p className="Session__federations__alert">
                    <span>StellarTerm federation address</span>
                    <span>
                        <input type="submit" className="s-button Session__federations__button" value="Enable" />
                    </span>
                </p>
            </div>
            <div className="Session__Account__text">
                You can set an alias for your StellarTerm account. We’ll use this in our trollbox, and it will become
                your payment alias, so people can send you money more easily.You can use this alias, including
                the*stellarx.com, instead of your public key to receive payments on Stellar.
            </div>
        </div>
    );
}
