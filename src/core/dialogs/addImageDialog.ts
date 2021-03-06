import d3 from "d3";

import template from "../templates/addImagePopup.html";
import imageUrls from "../imageUrls";
import utils from "../utils";

/**
 * An add image dialog
 * @constructor
 */
function AddImageDialog() {
  this.element = d3.select(template());
  this._dispatcher = d3.dispatch("imageSelected");
  this.on = this._dispatcher.on.bind(this._dispatcher);
  this._addImageUrl = this.element.select(".add_image_link");
  this._addImageButton = this.element.select(".add_image_btn");
  this._addImageDropZone = this.element.select(".image_local_add_drop_zone");
  this._addImageFileChooser = this.element.select(".add_image_file_chooser");
  this._addFilesContainer = this.element.select(".file_selection_container");
  this._selectedFilesContainer = this.element.select(".selected_files_container");
  this._resizeEnabled = this.element.select(".resize_enabled_cb");
  this._resizeWidth = this.element.select(".resize_width");
  this._resizeHeight = this.element.select(".resize_height");
  this._errorElement = this.element.select(".image_div_error");
  this._offlineEnabled = this.element.select(".offline_enabled_cb");
  this._selectedFiles = [];

  this._addImageButton.on("click", this._addImageButtonClicked.bind(this));
  this._addImageDropZone.on("dragover", this._addImageDropZoneDragOver.bind(this)).on("drop", this._addImageDropZoneDrop.bind(this)).on("dragleave", this._addImageDropZoneDragLeave.bind(this));
  this._addImageFileChooser.on("change", this._addImageFileChooserChange.bind(this));
}

/**
 * Shows the add image dialog
 * @returns {void}
 */
AddImageDialog.prototype.show = function () {
  this.element.style("display", "");
};

/**
 * Hides the add image dialog
 * @returns {void}
 */
AddImageDialog.prototype.hide = function () {
  this.element.style("display", "none");
};

/**
 * Returns true if the image dialog is hidden
 * @returns {boolean} true if hidden
 */
AddImageDialog.prototype.hidden = function () {
  return this.element.style("display") === "none";
};

/**
 * Resets the dialog to the default state
 * @param {boolean} [hide=true] If the dialog should be hidden
 * @returns {void}
 */
AddImageDialog.prototype.reset = function (hide) {
  this._selectedFiles.length = 0;
  this._addImageUrl.property("value", "");
  this._addImageFileChooser.property("value", "");
  this._addFilesContainer.style("display", "");
  this._errorElement.style("display", "none");
  this._selectedFilesContainer.style("display", "none").html("No files selected");
  if (hide !== false) {
    this.hide();
  }
};

/**
 * Adds a selected file to the list of selected files
 * @param {File} file The file that was selected
 * @returns {void}
 */
AddImageDialog.prototype._addSelectedFile = function (file) {
  var _this = this;

  this._selectedFiles.push(file);
  var fileContainer = this._selectedFilesContainer.html("").append("div").attr("role", "button").attr("tabIndex", 0).attr("class", "add_image_selected_file");
  fileContainer.append("span").text(file.name);
  fileContainer.append("img").attr("class", "selected_file_remove_btn").attr("src", imageUrls("close.png"));
  fileContainer.on("click", function () {
    _this.reset(false);
  });
  this._addFilesContainer.style("display", "none");
  this._selectedFilesContainer.style("display", "");
};

/**
 * Listener for the Add image button being clicked
 * @returns {void}
 */
AddImageDialog.prototype._addImageButtonClicked = function () {
  var _this2 = this;

  var imageUrl = this._addImageUrl.property("value");
  var finalizeImage = function finalizeImage(url) {
    var waitForImagePromise = function waitForImagePromise(p) {
      p.then(function (dataURL) {
        _this2._dispatcher.imageSelected(dataURL);
        _this2.reset();
      }, function (e) {
        var error = "Could not save image. ";
        var message = (e && e.message ? e.message : e) || "";

        // This occurs if the server does not have CORS set up properly, or does not allow canvas saving
        if (message.indexOf("tainted") >= 0) {
          error += "<br/>The image server is not set up correctly.<br/>Try disabling \"Keep Offline\" and \"Resize To\" options.";
        } else if (message.indexOf("CORS") >= 0 || message.indexOf("Cross")) {
          error += "<br/>The image server does not allow for the saving of images.<br/>Try disabling \"Keep Offline\" and \"Resize To\" options.";
        } else {
          error += "<br/>" + message;
        }
        _this2._errorElement.node().innerHTML = error;
        _this2._errorElement.style("display", "");
      });
    };

    // If we are resizing it
    if (_this2._resizeEnabled.property("checked")) {
      var width = _this2._resizeWidth.property("value");
      var height = _this2._resizeHeight.property("value");
      waitForImagePromise(utils.resizeImage(url, width, height, true));
    } else if (_this2._offlineEnabled.property("checked")) {
      waitForImagePromise(utils.imageUrlToDataURL(url));
    } else {
      _this2._dispatcher.imageSelected(url);
      _this2.reset();
    }
  };

  if (this._selectedFiles.length) {
    var fileReader = new FileReader();
    fileReader.onloadend = function (fileEvent) {
      finalizeImage(fileEvent.target.result);
    };
    fileReader.readAsDataURL(this._selectedFiles[0]);
  } else if (imageUrl) {
    finalizeImage(imageUrl);
  }
};

/**
 * Drag over listener for the drag/drop zone for files
 * @returns {void}
 */
AddImageDialog.prototype._addImageDropZoneDragOver = function () {
  stopEvent();

  var e = d3.event;
  e.dataTransfer.dropEffect = "copy";
  this._addImageDropZone.classed("dragging", true);
};

/**
 * Drag over listener for the drag/drop zone for files
 * @returns {void}
 */
AddImageDialog.prototype._addImageDropZoneDragLeave = function () {
  stopEvent();

  this._addImageDropZone.classed("dragging", false);
};

/**
 * Drop listener for the drag/drop zone for files
 * @returns {void}
 */
AddImageDialog.prototype._addImageDropZoneDrop = function () {
  stopEvent();

  var e = d3.event;
  var files = e.dataTransfer.files;
  this._addSelectedFile(files[0]);
};

/**
 * Listener for when the file chooser changes
 * @returns {void}
 */
AddImageDialog.prototype._addImageFileChooserChange = function () {
  this._addSelectedFile(this._addImageFileChooser.node().files[0]);
};

/**
 * Quick helper to completely stop an d3 event
 * @returns {void}
 */
function stopEvent() {
  var e = d3.event;
  e.stopPropagation();
  e.preventDefault();
}

const imageDialog = () => new AddImageDialog();

export default imageDialog; 