import React from 'react';
import PropTypes from 'prop-types';

import Driver from '../../lib/Driver';

export default function SessionAccountMenu(props) {
    // todo: move is-current check to method + logout also.
    return (
        <div className="subNavBackClipper">
            <div className="so-back subNavBack">
                <div className="so-chunk subNav">
                    <nav className="subNav__nav">
                        <a
                            className={`subNav__nav__item${window.location.hash === '#account' ? ' is-current' : ''}`}
                            href="#account">
                            <span>Balances</span>
                        </a>
                        <a
                            className={`subNav__nav__item${
                                window.location.hash === '#account/send' ? ' is-current' : ''
                            }`}
                            href="#account/send">
                            <span>Send</span>
                        </a>
                        <a
                            className={`subNav__nav__item${
                                window.location.hash === '#account/addTrust' ? ' is-current' : ''
                            }`}
                            href="#account/addTrust">
                            <span>Accept assets</span>
                        </a>
                        <a
                            className={`subNav__nav__item${
                                window.location.hash === '#account/history' ? ' is-current' : ''
                            }`}
                            href="#account/history">
                            <span>History</span>
                        </a>
                    </nav>
                    <nav className="subNav__nav">
                        <a
                            className={'subNav__nav__item'}
                            href="#account"
                            onClick={() => {
                                props.d.session.handlers.logout();
                            }}>
                            <span>Log out</span>
                        </a>
                    </nav>
                </div>
            </div>
        </div>
    );
}

SessionAccountMenu.propTypes = {
    d: PropTypes.instanceOf(Driver).isRequired,
};
