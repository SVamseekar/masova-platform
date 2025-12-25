// MongoDB script to clean up duplicate active working sessions
// Run this script in MongoDB shell or via mongosh

db = db.getSiblingDB('masova_users');

print("Starting cleanup of duplicate active working sessions...");

// Find all employees with multiple active sessions
const pipeline = [
    {
        $match: {
            isActive: true
        }
    },
    {
        $group: {
            _id: "$employeeId",
            count: { $sum: 1 },
            sessions: { $push: "$$ROOT" }
        }
    },
    {
        $match: {
            count: { $gt: 1 }
        }
    }
];

const duplicates = db.working_sessions.aggregate(pipeline).toArray();

print(`Found ${duplicates.length} employees with duplicate active sessions`);

let totalClosed = 0;

duplicates.forEach(employee => {
    print(`\nProcessing employee: ${employee._id}`);
    print(`  Active sessions: ${employee.count}`);

    // Sort sessions by loginTime (most recent first)
    employee.sessions.sort((a, b) => new Date(b.loginTime) - new Date(a.loginTime));

    const mostRecent = employee.sessions[0];
    print(`  Keeping most recent session: ${mostRecent._id} (${mostRecent.loginTime})`);

    // Close all other sessions
    for (let i = 1; i < employee.sessions.length; i++) {
        const session = employee.sessions[i];
        const logoutTime = new Date(mostRecent.loginTime);
        logoutTime.setMinutes(logoutTime.getMinutes() - 1);

        // Calculate total hours
        const loginTime = new Date(session.loginTime);
        const hours = (logoutTime - loginTime) / (1000 * 60 * 60);

        const result = db.working_sessions.updateOne(
            { _id: session._id },
            {
                $set: {
                    isActive: false,
                    logoutTime: logoutTime,
                    status: "AUTO_CLOSED",
                    totalHours: Math.max(0, hours)
                },
                $push: {
                    violations: {
                        code: "DUPLICATE_SESSION",
                        message: "Duplicate active session auto-closed during cleanup",
                        timestamp: new Date()
                    }
                }
            }
        );

        if (result.modifiedCount > 0) {
            print(`  ✓ Closed session: ${session._id} (${session.loginTime})`);
            totalClosed++;
        } else {
            print(`  ✗ Failed to close session: ${session._id}`);
        }
    }
});

print(`\n=== Cleanup Complete ===`);
print(`Total employees with duplicates: ${duplicates.length}`);
print(`Total sessions closed: ${totalClosed}`);

// Verify cleanup
const remainingDuplicates = db.working_sessions.aggregate(pipeline).toArray();
print(`Remaining duplicates: ${remainingDuplicates.length}`);

if (remainingDuplicates.length === 0) {
    print("✓ All duplicates have been resolved!");
} else {
    print("⚠ Some duplicates still remain. Please investigate.");
}
