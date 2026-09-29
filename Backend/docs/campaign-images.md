# Campaign image storage

CRM campaigns store validated JPG/PNG images (up to 1 MB) in MongoDB by default.
No Cloudinary request is made, even if shared Cloudinary credentials are present.
Email campaigns include the stored image as an inline attachment.

For WhatsApp images stored in MongoDB, configure `PUBLIC_API_URL` with the publicly
reachable HTTPS backend origin and set `JWT_SECRET` (or `CAMPAIGN_IMAGE_SECRET`).
Messaging credentials must also be configured. Localhost cannot be fetched by
WhatsApp. Without a public image URL, the campaign is saved and WhatsApp delivery
is reported as unsent.

To opt into Cloudinary, set `CRM_CAMPAIGN_IMAGE_STORAGE=cloudinary` and configure
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` with upload
access. Cloudinary failures fall back to MongoDB and emit a warning. Set
`CRM_CAMPAIGN_IMAGE_STORAGE=mongodb` to disable Cloudinary campaign uploads again.
Restart the backend after changing environment variables.

Run regression checks with `node --test tests/campaignImages.test.js` from Backend.
These tests mock external services and send no customer messages.
