sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"attachmentservice/test/integration/pages/AttachmentList.gen",
	"attachmentservice/test/integration/pages/AttachmentObjectPage.gen"
], function (JourneyRunner, AttachmentListGenerated, AttachmentObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('attachmentservice') + '/test/flp.html#app-preview',
        pages: {
			onTheAttachmentListGenerated: AttachmentListGenerated,
			onTheAttachmentObjectPageGenerated: AttachmentObjectPageGenerated
        },
        async: true
    });

    return runner;
});

