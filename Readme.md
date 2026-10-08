# RAP Attachment Service

 A SAP Fiori elements application and ABAP RAP business object for managing attachments. The project contains two parts:

 - `attachmentservice/`: SAPUI5/Fiori elements frontend.
 - `abap/zcch_test_attachment/`: abapGit export of the RAP business object, OData V4 service, attachment integration classes, and UI5 repository objects.

 SAP reference: [Smart Template Based Consumption | SAP Help Portal](https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/4c3d1c6b3d744f84aab4c273f979f430/b1388bfe4939443b8b125e99fd28e4cc.html?q=draft+table)

This example is using ODATA V2 version. For advance attachment service, can refer to ODATA V4, sample app Travel App that using this version, can check from SAP fiori library - sarch Advance attachment service app.

 ## Architecture

 ```text
 Fiori List Report / Object Page
						 |
						 | OData V4
						 v
 ZZUI_CCHATTACH_O4 (service definition/binding)
						 |
						 v
 ZZC_ATTACHMENT (projection/root query entity)
						 |
						 v
 ZZR_ATTACHMENT (RAP interface/root entity)
						 |
						 v
 ZZATTACHMENT / ZZATTACHMENT_D
	 active data     draft data

 Object Page attachment section
						 |
						 v
 SAP attachment reuse component
	 object type: ZCHOBJ01
 ```

 The attachment component is embedded in the Object Page and receives its object key from the current RAP instance:

 - Active instance: `UUID`
 - Draft instance: `DraftAdministrativeData/DraftUUID`

 ## Backend design

 ### Data model

 The persistent table `ZZATTACHMENT` stores the attachment business object header:

 | Field | Purpose |
 | --- | --- |
 | `UUID` | Managed key, exposed as `UUID` |
 | `DESCRIPTION` | Attachment object description |
 | `LOCAL_CREATED_BY`, `LOCAL_CREATED_AT` | Creation audit fields |
 | `LOCAL_LAST_CHANGED_BY`, `LOCAL_LAST_CHANGED_AT` | Local change and ETag fields |
 | `LAST_CHANGED_AT` | Total ETag field |

 `ZZATTACHMENT_D` is the RAP draft table for the RAP business object. Draft attachment records are stored by the SAP attachment framework in `ODATA_CV_ATTACH`; the records are associated with the RAP object through object type `ZCHOBJ01` and the generated object key. Attachment binary/link content is handled by the SAP attachment API rather than by the `ZZATTACHMENT` application table.

 ### CDS entities

 - `ZZR_ATTACHMENT` is the RAP root/interface view over `ZZATTACHMENT`.
 - `ZZC_ATTACHMENT` is the transactional projection exposed to the service.
 - Authorization checks are mandatory on both entities. The DCL role `ZZC_ATTACHMENT` grants select access using inherited conditions from `ZZR_ATTACHMENT`.

 ### Behavior

 `ZZR_ATTACHMENT` uses a managed, draft-enabled RAP implementation in `ZZBP_R_ATTACHMENT` and supports:

 - Create, update, and delete.
 - Draft `Edit`, `Resume`, `Prepare`, `Activate`, and `Discard`.
 - Managed UUID numbering.
 - ETags based on `LocalLastChangedAt` and `LastChangedAt`.
 - Additional save logic in `ZCL_CH_AUX_ATTACHMENT`.

 `ZZC_ATTACHMENT` is the projection behavior used by the OData UI service. The service definition `ZZUI_CCHATTACH_O4` exposes it as entity set `Attachment` through an OData V4 UI provider contract.

 ### Attachment lifecycle

 `ZCL_CH_AUX_ATTACHMENT` coordinates RAP draft processing with `CL_ODATA_CV_ATTACHMENT_API`:

 1. The attachment reuse component creates or changes attachment data for the current RAP object key.
 2. The RAP `Activate` action buffers the keys and changes `LocalLastChangedBy` so RAP still invokes save processing when only attachment data changed.
 3. The additional save phase calls the attachment API `SAVE` with object type `ZCHOBJ01` and `iv_no_commit = abap_true`.
 4. API messages and failed keys are converted to RAP reported/failed responses using `ZCX_ATTACHMENT`.
 5. If a draft is discarded, the auxiliary class calls the attachment API `CANCEL` for the draft object key. The discard path is skipped when activation is already in progress.

 `ZCL_CH_IM_ATT_SRV` implements `IF_EX_CV_ODATA_ATTACHMENT_AUTH`. Its current implementation sets `cv_no_authorization` to false and contains no additional user authorization logic. Backend authorizations should therefore be reviewed before productive use.

 ## Frontend design

 The UI5 application is generated as a Fiori elements V4 List Report/Object Page application using SAPUI5 `1.136.10` and the `sap_horizon` theme.

 ### Pages and routing

 - List Report route: `AttachmentList`, bound to `/Attachment`.
 - Object Page route: `AttachmentObjectPage`, bound to `/Attachment`.
 - The List Report uses a responsive table.
 - The Object Page is read-only at the header level and contains a custom attachment section.

 The Object Page embeds `sap.se.mi.plm.lib.attachmentservice.attachment` with:

 - `mode`: create/edit mode when the Fiori elements UI model is editable, otherwise display mode.
 - `objectType`: `ZCHOBJ01`.
 - `objectKey`: active `UUID` or draft `DraftUUID`.
 - Enabled actions: rename, delete, add file, add URL, and download.
 - Visible attributes: uploader, upload date, file size, links, status, title, source, and directory details.

 The custom controller extension currently contains only the generated `onInit` hook. The fragment is a `ComponentContainer`; attachment behavior is supplied by the SAP reuse component rather than custom upload code in this application.

 ### OData service configuration

 The frontend default model uses this OData V4 service path:

 ```text
 /sap/opu/odata4/sap/zzui_cchattach_o4/srvd/sap/zzui_cchattach_o4/0001/
 ```

 The local metadata is stored in `attachmentservice/webapp/localService/mainService/metadata.xml`. Annotation files are loaded from `attachmentservice/webapp/annotations/`.

 ## Prerequisites

 - Node.js LTS and npm.
 - SAPUI5 tooling dependencies installed with `npm install` in `attachmentservice/`.
 - An SAP backend where the RAP objects, service binding, attachment customizing, and required authorizations are active.
 - Network access and valid credentials for the configured SAP system when using the live service.

 ## Run the frontend

 From `attachmentservice/`:

 ```powershell
 npm install
 npm start
 ```

 The default development setup uses the Fiori tools proxy and forwards `/sap` to the SAP backend configured in `ui5-local.yaml`. The application opens in the Fiori tools preview shell.

 ### Mock data

 To run without the backend:

 ```powershell
 npm run start-mock
 ```

 The mock server uses the local OData metadata and generated data under `attachmentservice/webapp/localService/mainService/data`. Mock mode validates UI navigation and bindings, but it does not reproduce the SAP attachment API or real upload persistence.

 ### Other useful commands

 ```powershell
 npm run start-noflp   # Run the app without the Fiori launchpad preview
 npm run lint          # Run ESLint
 npm run build         # Create a production UI5 build in dist/
 npm run int-test      # Start the OPA integration test page
 ```

 ## Deploy the frontend

 ```powershell
 npm run deploy
 ```

 `attachmentservice/ui5-deploy.yaml` currently targets the SAP system configured by the project with client `100`, application `ZCH_ATTACHMENT`, package `ZCCH_TEST_ATTACHMENT`, and transport `ES6K900015`. Confirm the target, package, transport, and credentials before deploying to another system.

 The deployment builder excludes `/test/` and `/localService/`, so test assets and mock metadata are not uploaded with the production application.

 ## ABAP objects

 | Area | Objects |
 | --- | --- |
 | Tables | `ZZATTACHMENT`, `ZZATTACHMENT_D` |
 | RAP interface entity | `ZZR_ATTACHMENT` |
 | RAP projection entity | `ZZC_ATTACHMENT` |
 | Behavior implementations | `ZZBP_R_ATTACHMENT`, `ZZBP_C_ATTACHMENT` |
 | Auxiliary attachment handling | `ZCL_CH_AUX_ATTACHMENT` |
 | Attachment authorization BAdI | `ZCL_CH_IM_ATT_SRV` |
 | Exception/message mapping | `ZCX_ATTACHMENT` |
 | Service definition | `ZZUI_CCHATTACH_O4` |
 | Service binding | `ZZUI_CCHATTACH_O4` |
 | UI5 repository application | `ZCH_ATTACHMENT` |

 ## Troubleshooting checklist

 - Confirm the OData V4 service binding is published and the service path in `manifest.json` is reachable.
 - Check that the `Attachment` entity and draft actions are present in `$metadata`.
 - Verify `ZCHOBJ01` is the same object type used by the frontend and `ZCL_CH_AUX_ATTACHMENT`.
 - For attachments stuck in draft, inspect the additional save path and RAP reported/failed messages.
 - For discarded drafts, verify the attachment API cancellation succeeds for the draft UUID.
 - Check DCL and backend authorizations. The attachment authorization BAdI currently does not reject requests, but this is not a substitute for SAP authorization configuration.
 - Use `npm run start-mock` to separate frontend binding issues from backend and attachment API issues.

 ## Repository layout

 ```text
 .
 |-- Readme.md
 |-- abap/zcch_test_attachment/       ABAP and abapGit objects
 `-- attachmentservice/               UI5 application
		 |-- webapp/                      manifest, pages, annotations, tests
		 |-- ui5-local.yaml               live backend proxy and mock middleware
		 |-- ui5-mock.yaml                mock-only runtime configuration
		 `-- ui5-deploy.yaml              ABAP deployment configuration
 ```
