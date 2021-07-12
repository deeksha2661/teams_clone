
import React from "react";
import { TextField } from 'office-ui-fabric-react';
import { Button } from 'office-ui-fabric-react'

export default class Chat extends React.Component {
    constructor(props) {
        super(props);
        this.chatClient = props.chatClient;
        this.chatThreadClient = props.chatThreadClient;
        this.displayName = props.displayName;

        this.state = {
            chatMessageIdList: []
        };
    }

    async componentDidMount() {

        this.chatClient.on("chatMessageReceived", async () => {
            console.log("Notification chatMessageReceived!");
            await this.addChats();
        });
    }


    addChats = async () => {

        for await (const thread of this.chatClient.listChatThreads()) {
            const chatThreadClient = this.chatClient.getChatThreadClient(thread.id);
            for await (const message of chatThreadClient.listMessages()) {
                if (message.type === "text" && !this.state.chatMessageIdList.includes(message.id)) {
                    this.setState(prevState => ({
                        chatMessageIdList: [message.id, ...prevState.chatMessageIdList]
                    }));
                    this.handleReceiveMsg(message);
                    return;
                }
            }
        }
    }


    handleReceiveMsg = async (message) => {
        const li = document.createElement("li");
        if (message.content.message) {
            li.innerHTML = `${message.senderDisplayName} :` + "<br />" + `${message.content.message}`;
            document.getElementById("chat-list").prepend(li);
        }

    }

    handleSendMsg = async () => {
        try {
            const sendMessageRequest =
            {
                content: this.state.message
            };
            let sendMessageOptions =
            {
                senderDisplayName: this.displayName,
                type: 'text'
            };
            const sendChatMessageResult = await this.chatThreadClient.sendMessage(sendMessageRequest, sendMessageOptions);
            const messageId = sendChatMessageResult.id;
            console.log(this.state.message, `Message sent!, message id:${messageId}`);

        } catch (e) {
            console.error(e);
        }
    }

    render() {
        return (
            <>

                <div className="ms-Grid add-participant">
                    <div className="ms-Grid-row">
                        <div className="ms-Grid-col ms-lg12">
                            <div className="add-participant mb-0">
                                <TextField className="text-left w-100" onChange={(e) => { this.setState({ message: e.target.value }) }} />
                                <Button className="mt-2 add-user-button" onClick={this.handleSendMsg}>Send</Button>
                            </div>
                            <div className="add-participant-panel">
                                <ul id="chat-list">
                                </ul>

                            </div>

                        </div>
                    </div>
                </div>



            </>
        );
    }
}