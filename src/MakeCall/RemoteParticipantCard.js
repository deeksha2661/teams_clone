import React from "react";
import { utils } from '../Utils/Utils';
import { Persona, PersonaSize } from 'office-ui-fabric-react';
import { Icon } from '@fluentui/react/lib/Icon';

export default class RemoteParticipantCard extends React.Component {
    constructor(props) {
        super(props);
        this.call = props.call;
        this.remoteParticipant = props.remoteParticipant;
        this.id = utils.getIdentifierText(this.remoteParticipant.identifier);

        this.state = {
            isSpeaking: this.remoteParticipant.isSpeaking,
            state: this.remoteParticipant.state,
            isMuted: this.remoteParticipant.isMuted,
            displayName: this.remoteParticipant.displayName?.trim()
        };
    }

    async componentWillMount() {
        this.remoteParticipant.on('isMutedChanged', () => {
            this.setState({ isMuted: this.remoteParticipant.isMuted });
            if (this.remoteParticipant.isMuted) {
                this.setState({ isSpeaking: false });
            }
        });

        this.remoteParticipant.on('stateChanged', () => {
            this.setState({ state: this.remoteParticipant.state });
        });

        this.remoteParticipant.on('isSpeakingChanged', () => {
            this.setState({ isSpeaking: this.remoteParticipant.isSpeaking });
        })

        this.remoteParticipant.on('displayNameChanged', () => {
            this.setState({ displayName: this.remoteParticipant.displayName?.trim() });
        })
    }

    handleRemoveParticipant(e, identifier) {
        e.preventDefault();
        this.call.removeParticipant(identifier).catch((e) => console.error(e))
    }

    render() {
        return (
            <li className={`participant-item`} key={utils.getIdentifierText(this.remoteParticipant.identifier)}>
                <div className="ms-Grid-row panel-list-row">
                    <div className="ms-Grid-col ms-lg11 ms-sm10 panel-list-row-item">
                        <Persona className={this.state.isSpeaking ? `speaking-border-for-initials` : ``}
                            size={PersonaSize.size30}
                            text={this.state.displayName ? this.state.displayName : "User"}
                            secondaryText={this.state.state}
                            styles={{ primaryText: { color: '#edebe9' }, secondaryText: { color: '#edebe9' } }} />
                    </div>
                    <div className="ms-Grid-col ms-lg1 ms-sm2">
                        {
                            this.state.isMuted &&
                            <Icon className="icon-text-large" iconName="MicOff2" />
                        }
                        {
                            !this.state.isMuted &&
                            <Icon className="icon-text-large" iconName="Microphone" />
                        }
                        <span className="text-right participant-remove float-right"
                            onClick={e => this.handleRemoveParticipant(e, this.remoteParticipant.identifier)}>
                            <Icon className="icon-text-large" iconName="UserRemove" />
                        </span>
                    </div>


                </div>

            </li>
        )
    }
}



