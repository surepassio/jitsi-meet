// @flow

import _ from "lodash";
import { translate } from "../../base/i18n";
import { connect } from "../../base/redux";
import { AbstractCameraToggleButton } from "../../base/toolbox/components";
import type { AbstractButtonProps } from "../../base/toolbox/components";
import { setVideoInputDevice, getAnotherDeviceId } from "../../base/devices";
import { getCurrentCameraDeviceId } from "../../base/settings";
import Logger from "jitsi-meet-logger";
const logger = Logger.getLogger(__filename);

/**
 * The type of the React {@code Component} props of {@link CameraToggleButton}.
 */
type Props = AbstractButtonProps & {
    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,
};

/**
 * Component that renders a toolbar button for toggling the camera.
 *
 * @extends AbstractCameraToggleButton
 */
class CameraToggleButton extends AbstractCameraToggleButton<Props, *> {
    _cameraToggle: Function;

    accessibilityLabel = "toolbar.accessibilityLabel.toggleCamera";
    label = "toolbar.toggleCamera";
    tooltip = "toolbar.toggleCamera";

    /**
     * Initializes a new CameraToggleButton instance.
     *
     * @param {Props} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._cameraToggle = () => {
            const {
                _availableDevices,
                _currentCameraDeviceId,
                dispatch,
            } = props;
            getAnotherDeviceId(
                _availableDevices,
                "videoInput",
                _currentCameraDeviceId
            )
                .then((deviceId) => dispatch(setVideoInputDevice(deviceId)))
                .catch((error) =>
                    logger.error("No other camera available", error)
                );
        };
    }
    /**
     * Helper function to perform the actual toggling action.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _doCameraToggle() {
        this._cameraToggle();
    }
}

function _mapStateToProps(state) {
    const { availableDevices } = state["features/base/devices"];
    return {
        _availableDevices: availableDevices,
        _currentCameraDeviceId: getCurrentCameraDeviceId(state),
    };
}

export default translate(connect(_mapStateToProps)(CameraToggleButton));
