import { getStoredGoogleDriveToken, deleteGoogleDriveFile } from './firebase';
import { Submission } from './types';

// Scan Drive inside Voucher-APP for orphaned folders
// To do this safely, we would need to know what folders exist.
// This is complex. What if we just rely on the handleDelete hook?
