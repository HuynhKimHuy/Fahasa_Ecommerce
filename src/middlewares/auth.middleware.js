const buildRedirect = (req) => {
  const requested = req.originalUrl || "/";
  if (typeof requested !== "string") {
    return "/";
  }
  return requested.startsWith("/") ? requested : "/";
};

export function requireLogin(req, res, next) {
  if (!req.session?.user) {
    const redirect = encodeURIComponent(buildRedirect(req));
    return res.redirect(`/auth/login?redirect=${redirect}`);
  }
  next();
}

export function requireAdmin(req, res, next) {
  const user = req.session?.user;
  if (!user || user.role !== "admin") {
    const redirect = encodeURIComponent(buildRedirect(req));
    return res.redirect(`/auth/login?redirect=${redirect}`);
  }
  next();
}
