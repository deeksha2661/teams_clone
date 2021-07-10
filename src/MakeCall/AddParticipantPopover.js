
import React, { useState } from "react";
import { TextField } from 'office-ui-fabric-react';
import { Button } from 'office-ui-fabric-react'
import { Icon } from '@fluentui/react/lib/Icon';
import { utils } from "../Utils/Utils";
export default function AddParticipantPopover(props) {
    const [userId, setUserId] = useState('');
    const [showAddParticipantPanel, setShowAddParticipantPanel] = useState(false);

    function handleAddCommunicationUser() {
        console.log('handleAddCommunicationUser', userId);
        try {
            props.call.addParticipant({ communicationUserId: userId });
        } catch (e) {
            console.log("add correct id");
            console.error(e);
        }
    }

    function toggleAddParticipantPanel() {
        setShowAddParticipantPanel(!showAddParticipantPanel);
    }

    return (
        <>
            <span><h3>Participants</h3></span>
            <span className="add-participant-button"
                onClick={toggleAddParticipantPanel}>
                <Icon iconName="AddFriend" />
            </span>
            {
                props.groupId &&
                <span className="add-participant-button"
                    onClick={() => utils.copyToClipboard(props.groupId)}
                    title={"Share Group Id"}>
                    <Icon iconName="Link" />
                </span>
            }

            <div className="ms-Grid add-participant">
                <div className="ms-Grid-row">
                    <div className="ms-Grid-col ms-lg12">
                        {
                            showAddParticipantPanel &&
                            <div className="popover">
                                <h5 className="popover-header mb-0">Add a participant</h5>
                                <div className="popover-header mb-0">
                                    <TextField className="text-left w-100" label="User ID" onChange={e => setUserId(e.target.value)} />
                                    <Button className="mt-2 add-user-button" onClick={handleAddCommunicationUser}>Add User</Button>

                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>
        </>
    );
}