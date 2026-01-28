/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts access based on user roles
 * 
 * Roles:
 * - ADMIN: Full system access
 * - SALES: Customer and booking management
 * - CS: Customer service and interactions
 * - MANAGER: Read-only access to reports and dashboards
 */

/**
 * Creates a middleware that checks if user has any of the allowed roles
 * @param  {...string} allowedRoles - Roles permitted to access the route
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Check if user's role is in allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Predefined role combinations for common access patterns
 */
const roles = {
    ADMIN: 'ADMIN',
    SALES: 'SALES',
    CS: 'CS',
    MANAGER: 'MANAGER'
};

// Common role groups
const adminOnly = authorize(roles.ADMIN);
const staffOnly = authorize(roles.ADMIN, roles.SALES, roles.CS);
const salesAndAdmin = authorize(roles.ADMIN, roles.SALES);
const csAndAdmin = authorize(roles.ADMIN, roles.CS);
const managementOnly = authorize(roles.ADMIN, roles.MANAGER);
const allStaff = authorize(roles.ADMIN, roles.SALES, roles.CS, roles.MANAGER);

module.exports = {
    authorize,
    roles,
    adminOnly,
    staffOnly,
    salesAndAdmin,
    csAndAdmin,
    managementOnly,
    allStaff
};
