/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2024 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import "./style.css";

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { addButton, removeButton } from "@api/MessagePopover";
import { Devs } from "@utils/constants";
import { openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import Message from "discord-types/general";

import { Popover as NoteButtonPopover } from "./components/icons/NoteButton";
import { NoteModal } from "./components/modals/Notebook";
import noteHandler from "./noteHandler";
import { HolyNoteStore } from "./utils";

const messageContextMenuPatch: NavContextMenuPatchCallback = async (children, { message }: { message: Message; }) => {

    //console.log(await noteHandler.getAllNotes());
};


export default definePlugin({
    name: "HolyNotes",
    description: "Holy Notes allows you to save messages",
    authors: [Devs.Wolfie],
    dependencies: ["MessagePopoverAPI", "ChatInputButtonAPI"],


    toolboxActions: {
        async "Open Notes"() {
            openModal(props => <NoteModal {...props} />);
        }
    },
    contextMenus: {
        "message": messageContextMenuPatch
    },
    store: HolyNoteStore,

    async start() {
        addButton("HolyNotes", (message) => {
            return {
                label: "Save Note",
                icon: NoteButtonPopover,
                onClick: () => noteHandler.addNote(message, "Main")
            };
        });
    },

    async stop() {
        removeButton("HolyNotes");
    }
});

