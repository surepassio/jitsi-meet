// @flow

import _ from "lodash";
import React from "react";
import postis from "postis";

import VideoLayout from "../../../../../modules/UI/videolayout/VideoLayout";
import { getConferenceNameForTitle } from "../../../base/conference";
import { connect, disconnect } from "../../../base/connection";
import { translate } from "../../../base/i18n";
import { connect as reactReduxConnect } from "../../../base/redux";
import { Chat } from "../../../chat";
import { Filmstrip } from "../../../filmstrip";
import { CalleeInfoContainer } from "../../../invite";
import { LargeVideo } from "../../../large-video";
import { Prejoin, isPrejoinPageVisible } from "../../../prejoin";
import {
    Toolbox,
    fullScreenChanged,
    setToolboxAlwaysVisible,
    showToolbox,
} from "../../../toolbox";
import { LAYOUTS, getCurrentLayout } from "../../../video-layout";
import { maybeShowSuboptimalExperienceNotification } from "../../functions";
import {
    AbstractConference,
    abstractMapStateToProps,
} from "../AbstractConference";
import type { AbstractProps } from "../AbstractConference";

import InviteMore from "./InviteMore";
import Labels from "./Labels";
import { default as Notice } from "./Notice";
import { default as Subject } from "./Subject";
import { data } from "jquery";

declare var APP: Object;
declare var config: Object;
declare var interfaceConfig: Object;

/**
 * DOM events for when full screen mode has changed. Different browsers need
 * different vendor prefixes.
 *
 * @private
 * @type {Array<string>}
 */
const FULL_SCREEN_EVENTS = [
    "webkitfullscreenchange",
    "mozfullscreenchange",
    "fullscreenchange",
];

/**
 * The CSS class to apply to the root element of the conference so CSS can
 * modify the app layout.
 *
 * @private
 * @type {Object}
 */
const LAYOUT_CLASSNAMES = {
    [LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW]: "horizontal-filmstrip",
    [LAYOUTS.TILE_VIEW]: "tile-view",
    [LAYOUTS.VERTICAL_FILMSTRIP_VIEW]: "vertical-filmstrip",
};

/**
 * The type of the React {@code Component} props of {@link Conference}.
 */
type Props = AbstractProps & {
    /**
     * Whether the local participant is recording the conference.
     */
    _iAmRecorder: boolean,

    /**
     * The CSS class to apply to the root of {@link Conference} to modify the
     * application layout.
     */
    _layoutClassName: string,

    /**
     * Name for this conference room.
     */
    _roomName: string,

    /**
     * If prejoin page is visible or not.
     */
    _showPrejoin: boolean,

    dispatch: Function,
    t: Function,
};

/**
 * The conference page of the Web application.
 */
class Conference extends AbstractConference<Props, *> {
    _onFullScreenChange: Function;
    _onShowToolbar: Function;
    _originalOnShowToolbar: Function;

    /**
     * Initializes a new Conference instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Throttle and bind this component's mousemove handler to prevent it
        // from firing too often.
        this._originalOnShowToolbar = this._onShowToolbar;
        this._onShowToolbar = _.throttle(
            () => this._originalOnShowToolbar(),
            100,
            {
                leading: true,
                trailing: false,
            }
        );

        // Bind event handler so it is only bound once for every instance.
        this._onFullScreenChange = this._onFullScreenChange.bind(this);
    }

    /**
     * Start the connection and get the UI ready for the conference.
     *
     * @inheritdoc
     */
    componentDidMount() {
        document.title = `${this.props._roomName} | ${interfaceConfig.APP_NAME}`;
        this._start();

        const targetWindow = window.parent;

        const channel = postis({
            window: targetWindow,
            scope: "Screen Capture",
        });
        channel.ready(function () {
            channel.listen("remoteMessageFromParent", function (remoteMessage) {
                if (remoteMessage.command === "CAPTURE SCREEN") {
                    captureScreenAndSend(channel);
                }
            });
        });
    }
    /**
     * Calls into legacy UI to update the application layout, if necessary.
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidUpdate(prevProps) {
        if (
            this.props._shouldDisplayTileView ===
            prevProps._shouldDisplayTileView
        ) {
            return;
        }

        // TODO: For now VideoLayout is being called as LargeVideo and Filmstrip
        // sizing logic is still handled outside of React. Once all components
        // are in react they should calculate size on their own as much as
        // possible and pass down sizings.
        VideoLayout.refreshLayout();
    }

    /**
     * Disconnect from the conference when component will be
     * unmounted.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        APP.UI.unbindEvents();

        FULL_SCREEN_EVENTS.forEach((name) =>
            document.removeEventListener(name, this._onFullScreenChange)
        );

        APP.conference.isJoined() && this.props.dispatch(disconnect());
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            VIDEO_QUALITY_LABEL_DISABLED,

            // XXX The character casing of the name filmStripOnly utilized by
            // interfaceConfig is obsolete but legacy support is required.
            filmStripOnly: filmstripOnly,
        } = interfaceConfig;
        const { _iAmRecorder, _layoutClassName, _showPrejoin } = this.props;
        const hideVideoQualityLabel =
            filmstripOnly || VIDEO_QUALITY_LABEL_DISABLED || _iAmRecorder;

        return (
            <div
                className={_layoutClassName}
                id="videoconference_page"
                onMouseMove={this._onShowToolbar}
            >
                <Notice />
                <Subject />
                <InviteMore />
                <div id="videospace">
                    <LargeVideo />
                    {hideVideoQualityLabel || <Labels />}
                    <Filmstrip filmstripOnly={filmstripOnly} />
                </div>

                {filmstripOnly || _showPrejoin || <Toolbox />}
                {filmstripOnly || <Chat />}

                {this.renderNotificationsContainer()}

                {!filmstripOnly && _showPrejoin && <Prejoin />}

                <CalleeInfoContainer />
            </div>
        );
    }

    /**
     * Updates the Redux state when full screen mode has been enabled or
     * disabled.
     *
     * @private
     * @returns {void}
     */
    _onFullScreenChange() {
        this.props.dispatch(fullScreenChanged(APP.UI.isFullScreen()));
    }

    /**
     * Displays the toolbar.
     *
     * @private
     * @returns {void}
     */
    _onShowToolbar() {
        this.props.dispatch(showToolbox());
    }

    /**
     * Until we don't rewrite UI using react components
     * we use UI.start from old app. Also method translates
     * component right after it has been mounted.
     *
     * @inheritdoc
     */
    _start() {
        APP.UI.start();

        APP.UI.registerListeners();
        APP.UI.bindEvents();

        FULL_SCREEN_EVENTS.forEach((name) =>
            document.addEventListener(name, this._onFullScreenChange)
        );

        const { dispatch, t } = this.props;

        dispatch(connect());

        maybeShowSuboptimalExperienceNotification(dispatch, t);

        interfaceConfig.filmStripOnly &&
            dispatch(setToolboxAlwaysVisible(true));
    }
}

/**
 * Function to send message to parent window
 * {@code Conference} component
 *
 * @param {Object} channel
 * @param {Object} message
 * @private
 * @returns {String}
 */

function sendMessage(channel, message) {
    channel.send({
        method: "remoteMessageFromChild",
        params: { msg: { ...message }, from: "child iframe" },
    });
}

/**
 * Function to prepare data
 * {@code Conference} component
 *
 * @param {Boolean} success
 * @param {String} base64image
 * @private
 * @returns {Object}
 */

function prepareData(success, base64image) {
    let data;
    if (success) {
        data = {
            success: true,
            message: "Screen capture successful",
            status_code: 200,
            data: {
                image: base64image,
            },
        };
    } else {
        data = {
            success: false,
            message: "Screen capture unsuccessful",
            status_code: 400,
            data: {
                image: "",
            },
        };
    }

    return data;
}

/**
 * Function to capture screen
 * {@code Conference} component
 *
 * @param channel
 * @private
 * @returns {String}
 */

function captureScreenAndSend(channel) {
    let data;
    try {
        const videoDiv = document.getElementById("largeVideo");
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        if (!videoDiv.ended) {
            canvas.height = videoDiv.videoHeight / 2;
            canvas.width = videoDiv.videoWidth / 2;
            ctx.drawImage(videoDiv, 0, 0, canvas.width, canvas.height);
            var img_data = canvas
                .toDataURL("image/png", 1)
                .replace(/^data:image\/(png|jpg);base64,/, "");
            data = prepareData(true, img_data);
        } else {
            data = prepareData(false, "");
        }
    } catch (e) {
        data = prepareData(false, "");
    } finally {
        sendMessage(channel, data);
    }
}
/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code Conference} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        ...abstractMapStateToProps(state),
        _iAmRecorder: state["features/base/config"].iAmRecorder,
        _layoutClassName: LAYOUT_CLASSNAMES[getCurrentLayout(state)],
        _roomName: getConferenceNameForTitle(state),
        _showPrejoin: isPrejoinPageVisible(state),
    };
}

export default reactReduxConnect(_mapStateToProps)(translate(Conference));
