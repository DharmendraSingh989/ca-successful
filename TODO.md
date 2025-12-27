# TODO: Load Free Resources from Sub-Admin Uploads

## Task Overview
Load data from FreeResource database collection and display on Free Resources page. Filter resources uploaded by sub-admin where type = notes/document and isFree/isPublic = true. Render as list/cards with title, description, and view/download option.

## Information Gathered
- **FreeResource Model**: Contains title, description, fileUrl, createdBy, publishStatus, isPublished, isActive, resourceType (enum: notes, pdf, document, study-material)
- **User Model**: Has role field with values 'user', 'admin', 'subadmin'
- **Current Implementation**: getPublishedResourcesByType fetches published FreeResources but doesn't filter by sub-admin role or specific types
- **Frontend**: FreeResources.tsx already displays resources with title, description, and download button

## Plan
- [ ] Modify `getPublishedResourcesByType` in `backend/controllers/typedResourceController.js` for 'notes' category:
  - Add `resourceType: { $in: ['notes', 'document'] }` to query
  - Populate `createdBy` with 'name email role'
  - Filter results to only include resources where `createdBy.role === 'subadmin'`
- [ ] Test the API endpoint `/api/typed-resources/published/notes`
- [ ] Verify frontend displays filtered resources correctly

## Dependent Files to be Edited
- `backend/controllers/typedResourceController.js`

## Followup Steps
- [ ] Test API response includes only sub-admin uploaded notes/documents
- [ ] Confirm frontend renders the filtered data properly
- [ ] Handle edge cases (no resources found, etc.)
