// @flow

import { IconSwitchCamera } from '../../icons';

import AbstractButton from './AbstractButton';
import type { Props } from './AbstractButton';

/**
 * An abstract implementation of a button for Toggling the camera.
 */
export default class AbstractHangupButton<P : Props, S: *>
    extends AbstractButton<P, S> {

    icon = IconSwitchCamera;

    /**
     * Handles clicking / pressing the button, and Toggles the camera.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this._doCameraToggle();
    }

    /**
     * Helper function to perform the actual Camera Toggle.
     *
     * @protected
     * @returns {void}
     */
    _doCameraToggle() {
        // To be implemented by subclass.
    }
}
