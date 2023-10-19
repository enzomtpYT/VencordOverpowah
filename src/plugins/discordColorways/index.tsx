/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addContextMenuPatch, NavContextMenuPatchCallback, removeContextMenuPatch } from "@api/ContextMenu";
import * as DataStore from "@api/DataStore";
import { addAccessory, removeAccessory } from "@api/MessageAccessories";
import {
    addServerListElement,
    removeServerListElement,
    ServerListRenderPosition,
} from "@api/ServerList";
import { disableStyle, enableStyle } from "@api/Styles";
import { SwatchIcon } from "@components/Icons";
import { Devs } from "@utils/constants";
import { sendMessage } from "@utils/discord";
import { openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import {
    Button,
    Flex,
    Menu,
    PermissionsBits,
    PermissionStore,
    SelectedChannelStore,
    SettingsRouter,
    Text,
} from "@webpack/common";

import { ColorPickerModal } from "./components/colorPicker";
import ColorwaysButton from "./components/colorwaysButton";
import CreatorModal from "./components/creatorModal";
import Selector from "./components/selector";
import { SettingsPage } from "./components/settingsPage";
import { defaultColorwaySource } from "./constants";
import style from "./style.css?managed";
import { ColorPickerProps } from "./types";
import { getHex, stringToHex } from "./utils";

export let LazySwatchLoaded = false;

export let ColorPicker: React.FunctionComponent<ColorPickerProps> = () => {
    return (
        <Text
            tag="h2"
            variant="heading-md/semibold"
            className="colorways-creator-module-warning"
        >
            Module is loading, please wait...
        </Text>
    );
};

(async function () {
    const [customColorways, colorwaySourcesFiles, showColorwaysButton] = await DataStore.getMany([
        "customColorways",
        "colorwaySourceFiles",
        "showColorwaysButton"
    ]);

    if (!customColorways)
        DataStore.set("customColorways", []);

    if (!colorwaySourcesFiles)
        DataStore.set("colorwaySourceFiles", [defaultColorwaySource]);

    if (!showColorwaysButton)
        DataStore.set("showColorwaysButton", false);

})();

export const ColorwayCSS = {
    get: () => document.getElementById("activeColorwayCSS")?.textContent || "",
    set: (e: string) => {
        if (!document.getElementById("activeColorwayCSS")) {
            var activeColorwayCSS: HTMLStyleElement =
                document.createElement("style");
            activeColorwayCSS.id = "activeColorwayCSS";
            activeColorwayCSS.textContent = e;
            document.head.append(activeColorwayCSS);
        } else document.getElementById("activeColorwayCSS")!.textContent = e;
    },
    remove: () => document.getElementById("activeColorwayCSS")!.remove(),
};

const ctxMenuPatch: NavContextMenuPatchCallback = (children, props) => () => {
    if (props.channel.guild_id && !(PermissionStore.can(PermissionsBits.SEND_MESSAGES, props.channel))) return;
    children.push(
        <Menu.MenuItem
            id="colorways-send-id"
            label={<Flex flexDirection="row" style={{ alignItems: "center", gap: 8 }}>
                <SwatchIcon width={16} height={16} style={{ scale: "0.8" }} />
                Share Colorway via ID
            </Flex>}
            action={() => {
                const colorwayIDArray = `#${getHex(getComputedStyle(document.body).getPropertyValue("--brand-experiment")).split("#")[1]},#${getHex(getComputedStyle(document.body).getPropertyValue("--background-primary")).split("#")[1]},#${getHex(getComputedStyle(document.body).getPropertyValue("--background-secondary")).split("#")[1]},#${getHex(getComputedStyle(document.body).getPropertyValue("--background-tertiary")).split("#")[1]}`;
                const colorwayID = stringToHex(colorwayIDArray);
                const channelId = SelectedChannelStore.getChannelId();
                sendMessage(channelId, { content: `\`colorway:${colorwayID}\`` });
            }}
        />
    );
};

export default definePlugin({
    name: "DiscordColorways",
    description:
        "A plugin that offers easy access to simple color schemes/themes for Discord, also known as Colorways",
    authors: [Devs.DaBluLite, Devs.ImLvna],
    dependencies: ["ServerListAPI", "MessageAccessoriesAPI"],
    pluginVersion: "5.2.0",
    creatorVersion: "1.15",
    toolboxActions: {
        "Change Colorway": () => SettingsRouter.open("ColorwaysSettings"),
        "Open Colorway Creator": () =>
            openModal(props => (
                <ColorPickerModal modalProps={props} />
            )),
        "Open Color Stealer": () =>
            openModal(props => (
                <ColorPickerModal modalProps={props} />
            )),
    },
    patches: [
        {
            find: ".colorPickerFooter",
            replacement: {
                match: /function (\i).{0,200}\.colorPickerFooter/,
                replace: "$self.ColorPicker=$1;$&",
            },
        },
        {
            find: "Messages.ACTIVITY_SETTINGS",
            replacement: {
                match: /\{section:(\i)\.ID\.HEADER,\s*label:(\i)\.\i\.Messages\.APP_SETTINGS\}/,
                replace: "...$self.makeSettingsCategories($1),$&"
            }
        }
    ],
    set ColorPicker(e) {
        ColorPicker = e;
        LazySwatchLoaded = true;
    },

    customSections: [] as ((ID: Record<string, unknown>) => any)[],

    makeSettingsCategories({ ID }: { ID: Record<string, unknown>; }) {
        return [
            {
                section: ID.HEADER,
                label: "Discord Colorways",
                className: "vc-settings-header"
            },
            {
                section: "ColorwaysSelector",
                label: "Colors",
                element: Selector,
                className: "dc-colorway-selector"
            },
            {
                section: "ColorwaysSettings",
                label: "Settings",
                element: SettingsPage,
                className: "dc-colorway-settings"
            },
            ...this.customSections.map(func => func(ID)),
            {
                section: ID.DIVIDER
            }
        ].filter(Boolean);
    },

    ColorwaysButton: () => <ColorwaysButton />,

    async start() {
        addServerListElement(ServerListRenderPosition.In, this.ColorwaysButton);

        enableStyle(style);
        ColorwayCSS.set((await DataStore.get("actveColorway")) || "");

        addAccessory("colorways-btn", props => {
            if (String(props.message.content).match(/colorway:[0-9a-f]{0,71}/))
                return <Button onClick={() => {
                    openModal(propss => (
                        <CreatorModal
                            modalProps={propss}
                            colorwayID={String(props.message.content).match(/colorway:[0-9a-f]{0,71}/)![0]}
                        />
                    ));
                }} size={Button.Sizes.SMALL}>Add this Colorway...</Button>;
            return null;
        });
        addContextMenuPatch("channel-attach", ctxMenuPatch);
    },
    stop() {
        removeServerListElement(ServerListRenderPosition.In, this.ColorwaysButton);

        disableStyle(style);
        ColorwayCSS.remove();
        removeAccessory("colorways-btn");
        removeContextMenuPatch("channel-attach", ctxMenuPatch);
    },
});
