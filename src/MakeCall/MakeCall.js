import React from "react";
import { CallClient, LocalVideoStream } from '@azure/communication-calling';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { ChatClient } from '@azure/communication-chat';
import {
    PrimaryButton,
    TextField,
    MessageBar,
    MessageBarType
} from 'office-ui-fabric-react'

import Login from './Login';
import IncomingCallCard from './IncomingCallCard';
import CallCard from '../MakeCall/CallCard'
const aguid = require('aguid');
export default class MakeCall extends React.Component {
    constructor(props) {
        super(props);
        this.callClient = null;
        this.chatClient = null;
        this.chatThreadClient = null;
        this.callAgent = null;
        this.deviceManager = null;
        this.destinationUserIds = null;
        this.destinationGroup = null;
        this.callError = null;
        this.state = {
            id: undefined,
            groupId: undefined,
            displayName: undefined,
            loggedIn: false,
            call: undefined,
            incomingCall: undefined,
            selectedCameraDeviceId: null,
            selectedSpeakerDeviceId: null,
            selectedMicrophoneDeviceId: null,
            deviceManagerWarning: null,
            callError: null,
        };

    }

    handleLogIn = async (userDetails) => {
        if (userDetails) {
            try {
                const tokenCredential = new AzureCommunicationTokenCredential(userDetails.token);

                const endpointUrl = 'https://selfproject.communication.azure.com/';
                const chatClient = new ChatClient(endpointUrl, tokenCredential);
                console.log('Azure Communication Chat client created!');
                this.chatClient = chatClient;
                console.log("chill", this.chatClient);
                this.chatClient.startRealtimeNotifications();



                this.callClient = new CallClient();
                this.callAgent = await this.callClient.createCallAgent(tokenCredential, { displayName: userDetails.displayName });
                this.setState({ displayName: userDetails.displayName });
                this.setState({ id: userDetails.id });

                window.callAgent = this.callAgent;
                this.deviceManager = await this.callClient.getDeviceManager();
                await this.deviceManager.askDevicePermission({ audio: true });
                await this.deviceManager.askDevicePermission({ video: true });

                this.callAgent.on('callsUpdated', e => {
                    console.log(`callsUpdated, added=${e.added}, removed=${e.removed}`);

                    e.added.forEach(call => {
                        this.setState({ call: call });
                    });

                    e.removed.forEach(call => {
                        if (this.state.call && this.state.call === call) {
                            this.displayCallEndReason(this.state.call.callEndReason);
                        }
                    });
                });
                this.callAgent.on('incomingCall', args => {
                    const incomingCall = args.incomingCall;
                    if (this.state.call) {
                        incomingCall.reject();
                        return;
                    }

                    this.setState({ incomingCall: incomingCall });

                    incomingCall.on('callEnded', args => {
                        this.displayCallEndReason(args.callEndReason);
                    });

                });

                this.setState({ loggedIn: true });
            } catch (e) {
                console.error(e);
            }
        }
    }

    guid = () => {
        return aguid();

    }

    createChatThread = async () => {
        try {
            const createChatThreadRequest = {
                topic: "Chat Feature"
            };
            const createChatThreadOptions = {
                participants: [
                    {
                        id: { communicationUserId: this.state.id },
                        displayName: this.state.displayName
                    }
                ]
            };
            const createChatThreadResult = await this.chatClient.createChatThread(
                createChatThreadRequest,
                createChatThreadOptions
            );
            console.log(createChatThreadResult);
            const threadId = createChatThreadResult.chatThread.id;
            console.log(`Thread created:${threadId}`);

            let chatThreadClient = this.chatClient.getChatThreadClient(threadId);
            console.log(`Chat Thread client for threadId:${threadId}`);
            this.chatThreadClient = chatThreadClient;
        } catch (e) {
            console.error(e);
        }

    }


    displayCallEndReason = (callEndReason) => {
        if (callEndReason.code !== 0 || callEndReason.subCode !== 0) {
            this.setState({ callError: `Call end reason: code: ${callEndReason.code}, subcode: ${callEndReason.subCode}` });
        }

        this.setState({ call: null, incomingCall: null });
    }

    placeCall = async (withVideo) => {
        try {
            this.setState({ groupId: undefined });
            let identitiesToCall = [];
            const userIdsArray = this.destinationUserIds.value.split(',');

            userIdsArray.forEach((userId, index) => {
                if (userId) {
                    userId = userId.trim();
                    userId = { communicationUserId: userId };
                    if (!identitiesToCall.find(id => { return id === userId })) {
                        identitiesToCall.push(userId);
                    }
                }
            });

            const callOptions = await this.getCallOptions(withVideo);
            this.callAgent.startCall(identitiesToCall, callOptions);

        } catch (e) {
            console.error('Failed to place a call', e);
            this.setState({ callError: 'Failed to place a call: ' + e });
        }
    };

    joinGroup = async (withVideo) => {
        try {
            const callOptions = await this.getCallOptions(withVideo);
            this.setState({ groupId: this.destinationGroup.value });
            this.callAgent.join({ groupId: this.destinationGroup.value }, callOptions);
        } catch (e) {
            console.error('Failed to join a call', e);
            this.setState({ callError: 'Failed to join a call: ' + e });
            this.setState({ groupId: undefined });
        }
    };

    async getCallOptions(withVideo) {
        let callOptions = {
            videoOptions: {
                localVideoStreams: undefined
            },
            audioOptions: {
                muted: false
            }
        };

        let cameraWarning = undefined;
        let speakerWarning = undefined;
        let microphoneWarning = undefined;

        await this.deviceManager.askDevicePermission({ video: true });
        await this.deviceManager.askDevicePermission({ audio: true });

        const cameras = await this.deviceManager.getCameras();
        const cameraDevice = cameras[0];
        if (cameraDevice && cameraDevice?.id !== 'camera:') {
            this.setState({
                selectedCameraDeviceId: cameraDevice?.id,
                cameraDeviceOptions: cameras.map(camera => { return { key: camera.id, text: camera.name } })
            });
        }
        if (withVideo) {
            try {
                if (!cameraDevice || cameraDevice?.id === 'camera:') {
                    throw new Error('No camera devices found.');
                } else if (cameraDevice) {
                    callOptions.videoOptions = { localVideoStreams: [new LocalVideoStream(cameraDevice)] };
                }
            } catch (e) {
                cameraWarning = e.message;
            }
        }

        try {
            const speakers = await this.deviceManager.getSpeakers();
            const speakerDevice = speakers[0];
            if (!speakerDevice || speakerDevice.id === 'speaker:') {
                throw new Error('No speaker devices found.');
            } else if (speakerDevice) {
                this.setState({
                    selectedSpeakerDeviceId: speakerDevice.id,
                    speakerDeviceOptions: speakers.map(speaker => { return { key: speaker.id, text: speaker.name } })
                });
                await this.deviceManager.selectSpeaker(speakerDevice);
            }
        } catch (e) {
            speakerWarning = e.message;
        }

        try {
            const microphones = await this.deviceManager.getMicrophones();
            const microphoneDevice = microphones[0];
            if (!microphoneDevice || microphoneDevice.id === 'microphone:') {
                throw new Error('No microphone devices found.');
            } else {
                this.setState({
                    selectedMicrophoneDeviceId: microphoneDevice.id,
                    microphoneDeviceOptions: microphones.map(microphone => { return { key: microphone.id, text: microphone.name } })
                });
                await this.deviceManager.selectMicrophone(microphoneDevice);
            }
        } catch (e) {
            microphoneWarning = e.message;
        }

        if (cameraWarning || speakerWarning || microphoneWarning) {
            this.setState({
                deviceManagerWarning:
                    `${cameraWarning ? cameraWarning + ' ' : ''}
                    ${speakerWarning ? speakerWarning + ' ' : ''}
                    ${microphoneWarning ? microphoneWarning + ' ' : ''}`
            });
        }

        return callOptions;
    }

    render() {
        return (
            <div>
                <Login onLoggedIn={this.handleLogIn} createChat={this.createChatThread} />

                {
                    this.state.loggedIn &&

                    <div className="card">
                        <div className="ms-Grid">
                            <div></div>
                            {
                                !this.state.incomingCall && !this.state.call &&
                                <div>
                                    <div className="ms-Grid-row">
                                        <h2 className="ms-Grid-col ms-lg6 ms-sm6 mb-4">Placing and receiving calls</h2>
                                    </div>
                                    <div className="mb-2">Having provisioned an Identity, you are now ready to place calls, join group calls, and receiving calls.</div>
                                    <br></br>
                                </div>
                            }

                            {
                                this.state.callError &&
                                <MessageBar
                                    messageBarType={MessageBarType.error}
                                    isMultiline={false}
                                    onDismiss={() => { this.setState({ callError: undefined }) }}
                                    dismissButtonAriaLabel="Close">
                                    <b>{this.state.callError}</b>
                                </MessageBar>
                            }
                            {
                                this.state.deviceManagerWarning &&
                                <MessageBar
                                    messageBarType={MessageBarType.warning}
                                    isMultiline={false}
                                    onDismiss={() => { this.setState({ deviceManagerWarning: undefined }) }}
                                    dismissButtonAriaLabel="Close">
                                    <b>{this.state.deviceManagerWarning}</b>
                                </MessageBar>
                            }

                            {
                                !this.state.incomingCall && !this.state.call &&
                                <div className="ms-Grid-row mt-3">
                                    <div className="call-input-panel mb-5 ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl4">
                                        <h3 className="mb-1">Place a call</h3>
                                        <div>Enter an Identity to make a call to.</div>
                                        <div>You can specify multiple Identities to call by using "," separated values.</div>
                                        <TextField
                                            className="mt-3"
                                            disabled={this.state.call || !this.state.loggedIn}
                                            label="Destination Identity or Identities"
                                            componentRef={(val) => this.destinationUserIds = val} />

                                        <PrimaryButton
                                            className="primary-button"
                                            iconProps={{ iconName: 'Phone', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                            text="Place call"
                                            disabled={this.state.call || !this.state.loggedIn}
                                            onClick={() => this.placeCall(false)}>
                                        </PrimaryButton>
                                        <PrimaryButton
                                            className="primary-button"
                                            iconProps={{ iconName: 'Video', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                            text="Place call with video"
                                            disabled={this.state.call || !this.state.loggedIn}
                                            onClick={() => this.placeCall(true)}>
                                        </PrimaryButton>
                                    </div>
                                    <div className="call-input-panel mb-5 ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl4">
                                        <h3 className="mb-1">Join a group call</h3>
                                        <div>Enter Group ID to join the call.</div>
                                        <div>You can start a new Group call with given Group ID.</div>
                                        <TextField
                                            className="mt-3"
                                            disabled={this.state.call || !this.state.loggedIn}
                                            label="Group Id"
                                            defaultValue={this.guid()}
                                            componentRef={(val) => this.destinationGroup = val} />
                                        <PrimaryButton
                                            className="primary-button"
                                            iconProps={{ iconName: 'Group', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                            text="Join group call"
                                            disabled={this.state.call || !this.state.loggedIn}
                                            onClick={() => this.joinGroup(false)}>
                                        </PrimaryButton>
                                        <PrimaryButton
                                            className="primary-button"
                                            iconProps={{ iconName: 'Video', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                            text="Join group call with video"
                                            disabled={this.state.call || !this.state.loggedIn}
                                            onClick={() => this.joinGroup(true)}>
                                        </PrimaryButton>
                                    </div>
                                </div>
                            }
                            {
                                this.state.call &&
                                <CallCard
                                    chatClient={this.chatClient}
                                    chatThreadClient={this.chatThreadClient}
                                    id={this.state.id}
                                    groupId={this.state.groupId}
                                    displayName={this.state.displayName}
                                    call={this.state.call}
                                    deviceManager={this.deviceManager}
                                    selectedCameraDeviceId={this.state.selectedCameraDeviceId}
                                    cameraDeviceOptions={this.state.cameraDeviceOptions}
                                    speakerDeviceOptions={this.state.speakerDeviceOptions}
                                    microphoneDeviceOptions={this.state.microphoneDeviceOptions}
                                    onShowCameraNotFoundWarning={(show) => { this.setState({ showCameraNotFoundWarning: show }) }}
                                    onShowSpeakerNotFoundWarning={(show) => { this.setState({ showSpeakerNotFoundWarning: show }) }}
                                    onShowMicrophoneNotFoundWarning={(show) => { this.setState({ showMicrophoneNotFoundWarning: show }) }} />
                            }
                            {
                                this.state.incomingCall && !this.state.call &&
                                <IncomingCallCard
                                    incomingCall={this.state.incomingCall}
                                    acceptCallOptions={async () => await this.getCallOptions()}
                                    acceptCallWithVideoOptions={async () => await this.getCallOptions(true)}
                                    onReject={() => { this.setState({ incomingCall: undefined }) }} />
                            }
                        </div>
                    </div>
                }
            </div>

        );
    }
}