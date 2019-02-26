import React from 'react';
import PropTypes from 'prop-types';
import Driver from '../../lib/Driver';
import Validate from '../../lib/Validate';
import SendStepDestinationMemoContentInput from './SendStepDestinationMemoContentInput';
import SendStepDestinatinationMemoDropdown from './SendStepDestinationMemoDropdown';
import SendStepDestinatinationInput from './SendStepDestinationInput';
import SendStepEditLink from './SendStepEditLink';

export default class SendStepDestination extends React.Component {
    getStepContent() {
        const { d, isCurrentStep, stepIsPassed } = this.props;
        const { memoType, memoContent, accountId, handlers } = d.send;

        if (stepIsPassed) {
            return this.stepPassedContent();
        } else if (isCurrentStep) {
            let memoReady = true;
            let memoValidationMessage;

            if (memoType !== 'none') {
                const memoV = Validate.memo(memoContent, memoType);
                memoReady = memoV.ready;
                memoValidationMessage = memoV.message ? <p>{memoV.message}</p> : null;
            }

            return (
                <div className="Send__content">
                    <SendStepDestinatinationInput d={d} />
                    <SendStepDestinatinationMemoDropdown d={d} />
                    {memoType !== 'none' ? <SendStepDestinationMemoContentInput d={d} /> : null}
                    {memoValidationMessage}

                    <div className="Send__panel__next">
                        <button className="s-button" disabled={!accountId || !memoReady} onClick={handlers.step1Next}>
                            Save and continue
                        </button>
                    </div>
                </div>
            );
        }
        return null;
    }

    stepPassedContent() {
        const { memoType, memoContent, address, accountId } = this.props.d.send;

        return (
            <div className="Send__content Send__overview">
                {address ? (
                    <p className="Send__overviewLine">
                        Stellar address: <strong>{address}</strong>
                    </p>
                ) : null}

                <p className="Send__overviewLine">
                    Account ID: <strong>{accountId}</strong>
                </p>

                {memoType !== 'none' ? (
                    <p className="Send__overviewLine">
                        {memoType}: <strong>{memoContent}</strong>
                    </p>
                ) : null}
            </div>
        );
    }

    render() {
        const { d, isCurrentStep, stepIsPassed } = this.props;
        const { step1Edit } = d.send.handlers;
        const stepContent = this.getStepContent();

        return (
            <div className={`Send__panel${!isCurrentStep && !stepIsPassed ? ' is-future' : ''}`}>
                <h3 className={`Send__title${isCurrentStep ? ' is-active' : ''}`}>
                    1. Destination <SendStepEditLink stepIsPassed={stepIsPassed} editStep={step1Edit} />
                </h3>
                {stepContent}
            </div>
        );
    }
}

SendStepDestination.propTypes = {
    d: PropTypes.instanceOf(Driver).isRequired,
    isCurrentStep: PropTypes.bool.isRequired,
    stepIsPassed: PropTypes.bool.isRequired,
};
