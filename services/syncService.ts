import { Course, UserProfile } from '../types';

/**
 * SyncService: Orchestrates the "Zero-Knowledge" scale strategy.
 * At 1M users, we transition from purely LocalStorage to a 
 * Cloud-Synced (Supabase) model for metadata only.
 */

export type SyncStatus = 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR' | 'OFFLINE';

class SyncService {
    private status: SyncStatus = 'IDLE';
    private lastSync: number = 0;
    private subscribers: ((status: SyncStatus) => void)[] = [];

    subscribe(callback: (status: SyncStatus) => void) {
        this.subscribers.push(callback);
    }

    private notify() {
        this.subscribers.forEach(cb => cb(this.status));
    }

    /**
     * Optimistic Sync Logic
     * Simulates pushing metadata to the global sync layer
     */
    async syncCourseMetadata(course: Course) {
        if (this.status === 'SYNCING') return;
        
        this.status = 'SYNCING';
        this.notify();

        try {
            // SIMULATED CLOUD LATENCY
            await new Promise(resolve => setTimeout(resolve, 800));

            // Logic: Strip heavy base64 before cloud sync to save bandwidth at 1M scale
            const cloudMetadata = {
                id: course.id,
                title: course.title,
                progress: course.progress,
                moduleCount: course.modules.length,
                updatedAt: Date.now()
            };

            // At 1M users, this call would be: 
            // await supabase.from('course_sync').upsert(cloudMetadata);
            
            console.log(`[ScaleEngine] Metadata synced for ${course.id} at 1M user scale.`);
            
            this.status = 'SUCCESS';
            this.lastSync = Date.now();
            this.notify();

            setTimeout(() => {
                this.status = 'IDLE';
                this.notify();
            }, 2000);

        } catch (e) {
            console.error("[ScaleEngine] Sync Failed", e);
            this.status = 'ERROR';
            this.notify();
        }
    }

    getLastSyncTime() {
        return this.lastSync;
    }
}

export const syncEngine = new SyncService();