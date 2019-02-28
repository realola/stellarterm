import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import AssetCard2 from '../AssetCard2';
import Validate from '../../lib/Validate';
import Driver from '../../lib/Driver';

export default class Send extends React.Component {
    constructor(props) {
        super(props);
        this.listenId = this.props.d.send.event.listen(() => {
            this.forceUpdate();
        });
    }
    componentWillUnmount() {
        this.props.d.send.event.unlisten(this.listenId);
    }
    render() {
        const d = this.props.d;

        const state = d.send.state;

        if (state === 'setup') {
            const step = this.props.d.send.step;
            const step1ClassName = `Send__panel${step < 1 ? ' is-future' : ''}`;
            const step2ClassName = `Send__panel${step < 2 ? ' is-future' : ''}`;
            const step3ClassName = `Send__panel${step < 3 ? ' is-future' : ''}`;
            const step4ClassName = `Send__panel${step < 4 ? ' is-future' : ''}`;

            const step1TitleClassName = `Send__title${step === 1 ? ' is-active' : ''}`;
            const step2TitleClassName = `Send__title${step === 2 ? ' is-active' : ''}`;
            const step3TitleClassName = `Send__title${step === 3 ? ' is-active' : ''}`;
            const step4TitleClassName = `Send__title${step === 4 ? ' is-active' : ''}`;

            // All the steps are in this page to reduce fragmentation

            // Step 1
            let Step1Content;
            if (step === 1) {
                const destError =
                    Validate.publicKey(d.send.step1.destInput).message &&
                    Validate.address(d.send.step1.destInput).message;
                let destinationValidationMessage;
                if (destError) {
                    destinationValidationMessage = <p>Stellar address or account ID is invalid.</p>;
                }

                let memoContentInput;
                let memoReady = true;
                let memoValidationMessage;
                let memoNote;
                if (d.send.memoType !== 'none') {
                    let memoPlaceholder;
                    switch (d.send.memoType) {
                    case 'MEMO_ID':
                        memoPlaceholder = 'Memo ID number';
                        break;
                    case 'MEMO_TEXT':
                        memoPlaceholder = 'Up to 28 bytes of text';
                        break;
                    case 'MEMO_HASH':
                    case 'MEMO_RETURN':
                        memoPlaceholder = '64 character hexadecimal encoded string';
                        break;
                    default:
                        break;
                    }

                    let memoContentInputClassName = 's-inputGroup__item S-flexItem-share';
                    if (d.send.memoContentLocked) {
                        memoContentInputClassName += ' is-disabled';
                    }
                    memoContentInput = (
                        <label className="s-inputGroup Send__input" htmlFor="memoContentInput">
                            <span className="s-inputGroup__item s-inputGroup__item--tag S-flexItem-1of4">
                                <span>Memo content</span>
                            </span>
                            <input
                                className={memoContentInputClassName}
                                disabled={d.send.memoContentLocked}
                                name="memoContentInput"
                                type="text"
                                value={d.send.memoContent}
                                onChange={d.send.handlers.updateMemoContent}
                                placeholder={memoPlaceholder} />
                        </label>
                    );

                    const memoV = Validate.memo(d.send.memoContent, d.send.memoType);
                    memoReady = memoV.ready;
                    if (memoV.message) {
                        memoValidationMessage = <p>{memoV.message}</p>;
                    }
                }

                let dropdownClassName = 'so-dropdown s-inputGroup__item S-flexItem-noFlex';
                if (d.send.memoRequired) {
                    dropdownClassName += ' is-disabled';
                    memoNote = 'Recipient requires a memo. Please make sure it is correct.';
                }

                let federationNotice;
                if (d.send.address) {
                    federationNotice = (
                        <p className="Send__federationNotice">
                            <strong>{d.send.address}</strong> resolved to <strong>{d.send.accountId}</strong>
                        </p>
                    );
                } else if (d.send.addressNotFound) {
                    federationNotice = (
                        <p className="Send__federationNotice">
                            Unable to resolve address <strong>{d.send.step1.destInput}</strong>
                        </p>
                    );
                }

                let selfSendNotice;
                if (d.send.step1.destInput === d.session.account.account_id) {
                    selfSendNotice = (
                        <div className="s-alert s-alert--warning">
                            <strong>Warning: You are sending to yourself!</strong>
                        </div>
                    );
                }

                Step1Content = (
                    <div className="Send__content">
                        <label className="s-inputGroup Send__input" htmlFor="inputDestSend">
                            <span className="s-inputGroup__item s-inputGroup__item--tag S-flexItem-1of4">
                                <span>Destination</span>
                            </span>
                            <input
                                className="s-inputGroup__item S-flexItem-share"
                                name="inputDestSend"
                                type="text"
                                value={d.send.step1.destInput}
                                onChange={d.send.handlers.updateDestination}
                                placeholder="example: username*getstargazer.com or
                                GC4DJYMFQZVX3R56FVCN3WA7FJFKT24VI67ODTZUENSE4YNUXZ3WYI7R" />
                        </label>
                        {selfSendNotice}
                        {destinationValidationMessage}
                        {federationNotice}
                        <label className="s-inputGroup Send__input" htmlFor="inputSelectMemoType">
                            <span className="s-inputGroup__item s-inputGroup__item--tag S-flexItem-1of4">
                                <span>Memo type</span>
                            </span>
                            <span className={dropdownClassName}>
                                <select
                                    value={d.send.memoType}
                                    onChange={d.send.handlers.updateMemoType}
                                    disabled={d.send.memoRequired}
                                    name="inputSelectMemoType"
                                    className="so-dropdown__select">
                                    <option>none</option>
                                    <option>MEMO_ID</option>
                                    <option>MEMO_TEXT</option>
                                    <option>MEMO_HASH</option>
                                    <option>MEMO_RETURN</option>
                                </select>
                            </span>
                            <span className="s-inputGroup__item s-inputGroup__item--tagMin S-flexItem-share">
                                <span className="Send__memoNotice">{memoNote}</span>
                            </span>
                        </label>
                        {memoContentInput}
                        {memoValidationMessage}
                        <div className="Send__panel__next">
                            <button
                                className="s-button"
                                disabled={!d.send.accountId || !memoReady}
                                onClick={d.send.handlers.step1Next}>
                                Save and continue
                            </button>
                        </div>
                    </div>
                );
            } else if (step > 1) {
                const memoSummary =
                    d.send.memoType === 'none' ? null : (
                        <p className="Send__overviewLine">
                            {d.send.memoType}: <strong>{d.send.memoContent}</strong>
                        </p>
                    );
                if (d.send.address) {
                    Step1Content = (
                        <div className="Send__content Send__overview">
                            <p className="Send__overviewLine">
                                Stellar address: <strong>{d.send.address}</strong>
                            </p>
                            <p className="Send__overviewLine">
                                Account ID: <strong>{d.send.accountId}</strong>
                            </p>
                            {memoSummary}
                        </div>
                    );
                } else {
                    Step1Content = (
                        <div className="Send__content Send__overview">
                            <p className="Send__overviewLine">
                                Account ID: <strong>{d.send.accountId}</strong>
                            </p>
                            {memoSummary}
                        </div>
                    );
                }
            }

            let Step1Edit;
            if (step > 1) {
                Step1Edit = (
                    <a className="Send__title__edit" onClick={d.send.handlers.step1Edit}>
                        Edit
                    </a>
                );
            }
            const Step1 = (
                <div className={step1ClassName}>
                    <h3 className={step1TitleClassName}>1. Destination {Step1Edit}</h3>
                    {Step1Content}
                </div>
            );

            // Step 2

            let Step2Content;
            if (step === 2) {
                const assetCards = _.map(d.send.availableAssets, (availability, slug) => {
                    if (availability === undefined) {
                        console.log('Undefined availability');
                        return;
                    }
                    let rightSide;
                    if (availability.sendable) {
                        rightSide = (
                            <div className="row__shareOption">
                                <a
                                    className="s-button"
                                    onClick={() => {
                                        d.send.handlers.step2PickAsset(slug);
                                    }}>
                                    Send {availability.asset.getCode()}
                                </a>
                            </div>
                        );
                    } else {
                        rightSide = <div className="row__shareOption">Destination does not accept this asset.</div>;
                    }
                    console.log(availability);
                    return (
                        <div className="row--lite" key={slug}>
                            <div className="row__fixedAsset">
                                <AssetCard2
                                    code={availability.asset.getCode()}
                                    issuer={availability.asset.getIssuer()} />
                            </div>
                            {rightSide}
                        </div>
                    );
                });

                Step2Content = (
                    <div className="Send__content">
                        <div className="Send__assetPicker">{assetCards}</div>
                        <div className="Send__panel__next" />
                    </div>
                );
            } else if (step > 2) {
                Step2Content = (
                    <div className="Send__content Send__overview Send__assetContainer">
                        <AssetCard2
                            code={d.send.step2.availability.asset.getCode()}
                            issuer={d.send.step2.availability.asset.getIssuer()} />
                    </div>
                );
            }
            let Step2Edit;
            if (step > 2) {
                Step2Edit = (
                    <a className="Send__title__edit" onClick={d.send.handlers.step2Edit}>
                        Edit
                    </a>
                );
            }
            const Step2 = (
                <div className={step2ClassName}>
                    <h3 className={step2TitleClassName}>2. Asset {Step2Edit}</h3>
                    {Step2Content}
                </div>
            );

            // Step 3
            let Step3Edit;
            if (step > 3) {
                Step3Edit = (
                    <a className="Send__title__edit" onClick={d.send.handlers.step3Edit}>
                        Edit
                    </a>
                );
            }
            let Step3Content;
            if (step === 3) {
                let amountValid = Validate.amount(d.send.step3.amount);
                let amountValidationMessage;
                const maxLumenSpend = d.session.account.maxLumenSpend();
                let yourBalance;
                if (amountValid === false) {
                    amountValidationMessage = <p>Amount is invalid</p>;
                } else if (d.send.step2.availability.asset !== null) {
                    const targetBalance = d.session.account.getBalance(
                        new StellarSdk.Asset(
                            d.send.step2.availability.asset.code,
                            d.send.step2.availability.asset.issuer,
                        ),
                    );
                    if (targetBalance !== null) {
                        yourBalance = (
                            <p>
                                You have {targetBalance} {d.send.step2.availability.asset.code}.
                            </p>
                        );
                    }

                    if (
                        d.send.step2.availability.asset.code === 'XLM' &&
                        d.send.step2.availability.asset.issuer === undefined
                    ) {
                        if (Number(d.send.step3.amount) > Number(d.session.account.maxLumenSpend())) {
                            amountValid = false;
                            amountValidationMessage = (
                                <p>
                                    You may only send up to <strong>{maxLumenSpend} lumens</strong> due to the minimum
                                    balance requirements. For more information, see the{' '}
                                    <a href="#account">minimum balance tool</a>.
                                </p>
                            );
                        }
                    }
                }
                Step3Content = (
                    <div className="Send__content">
                        <label className="s-inputGroup Send__input" htmlFor="inputSendAmount">
                            <span className="s-inputGroup__item s-inputGroup__item--tag S-flexItem-1of4">
                                <span>Amount</span>
                            </span>
                            <input
                                className="s-inputGroup__item S-flexItem-share"
                                name="inputSendAmount"
                                type="text"
                                value={d.send.step3.amount}
                                onChange={d.send.handlers.updateAmount}
                                placeholder="" />
                        </label>
                        {yourBalance}
                        {amountValidationMessage}
                        <div className="Send__panel__next">
                            <button className="s-button" disabled={!amountValid} onClick={d.send.handlers.step3Next}>
                                Save and continue
                            </button>
                        </div>
                    </div>
                );
            } else if (step > 3) {
                Step3Content = (
                    <div className="Send__content Send__overview">
                        <p className="Send__overviewLine">
                            Amount:{' '}
                            <strong>
                                {d.send.step3.amount} {d.send.step2.availability.asset.getCode()}
                            </strong>
                        </p>
                    </div>
                );
            }
            const Step3 = (
                <div className={step3ClassName}>
                    <h3 className={step3TitleClassName}>3. Amount {Step3Edit}</h3>
                    {Step3Content}
                </div>
            );

            // Step 4
            const Step4Next =
                step !== 4 ? null : (
                    <div className="Send__panel__next">
                        <p>
                            Note: Transactions on the Stellar network are irreversible. Please make sure all the
                            transaction details are correct.
                        </p>
                        <button className="s-button" onClick={d.send.handlers.submit}>
                            Submit transaction
                        </button>
                    </div>
                );

            const Step4 = (
                <div className={step4ClassName}>
                    <h3 className={step4TitleClassName}>4. Review</h3>
                    <div className="Send__content">{Step4Next}</div>
                </div>
            );

            return (
                <div className="island">
                    <div className="island__header">Send payment</div>
                    {Step1}
                    <div className="Send__separator" />
                    {Step2}
                    <div className="Send__separator" />
                    {Step3}
                    <div className="Send__separator" />
                    {Step4}
                </div>
            );
        } else if (state === 'pending') {
            return (
                <div className="island">
                    <div className="island__header">Send Payment</div>
                    <div className="Send__submitting">Submitting transaction...</div>
                </div>
            );
        } else if (state === 'success') {
            return (
                <div className="island">
                    <div className="island__header">Send Payment</div>
                    <h3 className="Send__resultTitle">Success!</h3>
                    <div className="Send__resultContent">
                        <p>
                            Transaction ID:{' '}
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href={`${d.Server.serverUrl}/transactions/${d.send.txId}`}>
                                {d.send.txId}
                            </a>
                            <br />
                            Keep the transaction ID as proof of payment.
                        </p>
                    </div>
                    <button className="s-button Send__startOver" onClick={d.send.handlers.reset}>
                        Start over
                    </button>
                </div>
            );
        }
        // state is error
        return (
            <div className="island">
                <div className="island__header">Send Payment</div>
                <h3 className="Send__resultTitle">Error</h3>
                <pre className="Send__errorPre">{d.send.errorDetails}</pre>
                <button className="s-button Send__startOver" onClick={d.send.handlers.reset}>
                    Start over
                </button>
            </div>
        );
    }
}

Send.propTypes = {
    d: PropTypes.instanceOf(Driver).isRequired,
};
