import React from "react";
import { TextField, PrimaryButton } from 'office-ui-fabric-react'
import { utils } from "../Utils/Utils";
import { Icon } from '@fluentui/react/lib/Icon';
const { CommunicationIdentityClient } = require('@azure/communication-identity');

const connectionString = "endpoint=https://selfproject.communication.azure.com/;accesskey=VJwQLEAgLDu2M5E37sqzzsL4taSJXz3bHkFMu2sd+9OBhgkHXrEE+76yPGRTaa7hrqj/iX74IlNzq+tEnpnz1Q=="

export default class Login extends React.Component {
    constructor(props) {
        super(props);
        this.userDetailsResponse = undefined;
        this.displayName = undefined;
        this.state = {
            id: undefined,
            showSpinner: false,
            disableInitializeButton: false,
            loggedIn: false
        }
    }

    provisionNewUser = async () => {
        try {
            this.setState({ showSpinner: true, disableInitializeButton: true });
            this.userDetailsResponse = await this.makeRequest();
            await this.props.onLoggedIn({ id: this.state.id, token: this.userDetailsResponse.token, displayName: this.displayName });
            this.setState({ loggedIn: true });
            await this.props.createChat();
        } catch (error) {
            console.log(error);
        } finally {
            this.setState({ disableInitializeButton: false, showSpinner: false });
        }
    }

    makeRequest = async () => {
        try {
            const identityClient = new CommunicationIdentityClient(connectionString);
            let identityResponse = await identityClient.createUser();
            console.log(`\nCreated an identity with ID: ${identityResponse.communicationUserId}`);

            // Issue an access token with the "voip" and "chat" scope for an identity
            let tokenResponse = await identityClient.getToken(identityResponse, ["voip", "chat"]);
            this.setState({ id: utils.getIdentifierText(identityResponse) });
            return tokenResponse;

        } catch (error) {
            console.log(error);
            throw new Error('Invalid token response');
        }
    }

    render() {

        return (
            <div className="card">
                <div className="ms-Grid">
                    <div className="ms-Grid-row">
                        <h2 className="ms-Grid-col ms-lg6 ms-sm6 mb-4">Welcome!</h2>
                    </div>
                    {
                        !this.state.loggedIn &&
                        <div>Create an User Identity to start using the service </div>

                    }

                    {
                        this.state.showSpinner &&
                        <div className="custom-row justify-content-center align-items-center mt-4">
                            <div className="loader"> </div>
                            <div className="ml-2">Creating a new User Identity...</div>
                        </div>
                    }
                    {
                        this.state.loggedIn &&
                        <div>
                            <div>Congrats <span className="identity"><b>{this.displayName}</b></span>!</div>
                            <div> You've provisioned an user identity.
                                You are ready to start making calls!</div>
                            <div>The Identity you've provisioned is:
                                <span className="identity"><b>{this.state.id}</b></span>
                                <span className="clipboard-button"
                                    onClick={() => utils.copyToClipboard(this.state.id)}
                                    title={"Copy to Clipboerd"}>
                                    <Icon iconName="Copy" />
                                </span>
                            </div>

                        </div>
                    }
                    {
                        !this.state.loggedIn &&
                        <div>
                            <div className="ms-Grid-row">
                                <div className="ms-Grid-col ms-sm12 ms-lg6 ms-xl6 ms-xxl3 align-items-center displayName-text-box">
                                    <TextField className="mt-3"
                                        defaultValue={undefined}
                                        label="Optional display name"
                                        onChange={(e) => { this.displayName = e.target.value }} />
                                </div>
                            </div>
                            <div className="mt-1">
                                <PrimaryButton className="primary-button mt-3"
                                    iconProps={{ iconName: 'ReleaseGate', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                    label="Provision an user"
                                    disabled={this.state.disableInitializeButton}
                                    onClick={() => this.provisionNewUser()}>
                                    Request an ID
                                </PrimaryButton>
                            </div>
                        </div>
                    }
                </div>
            </div>
        );
    }
}
