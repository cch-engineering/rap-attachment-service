sap.ui.define(['sap/ui/core/mvc/ControllerExtension'], function (ControllerExtension) {
	'use strict';

	return ControllerExtension.extend('attachmentservice.ext.controller.ObjectPageExt', {
		// this section allows to extend lifecycle hooks or hooks provided by Fiori elements
		override: {
			/**
			 * Called when a controller is instantiated and its View controls (if available) are already created.
			 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
			 * @memberOf attachmentservice.ext.controller.ObjectPageExt
			 */
			onInit: function () {
				// you can access the Fiori elements extensionAPI via this.base.getExtensionAPI
				// var oModel = this.base.getExtensionAPI().getModel();
				// var oUIModel = this.base.getExtensionAPI().getModel("ui");

				// var that = this;
				// //var oPromise = this.getOwnerComponent().
				// var oPromise = this.base.getAppComponent().createComponent({
				// 	usage: "attachmentReuseComponent",
				// 	settings: {
				// 		mode: oUIModel.getProperty("/editable"),
				// 		objectKey: oModel.getProperty("/UUID"),
				// 		objectType: "MARA"
				// 	}
				// });
				// oPromise.then(function (attachmentComponent) {
				// 	that.byId("attachmentComponentContainer").setComponent(attachmentComponent);
				// });

			}
		}
	});
});
