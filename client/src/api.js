const h = () => ({ "Content-Type":"application/json", Authorization:"Bearer "+(localStorage.getItem("tk")||"") });
const req = async (m,u,b) => {
  const r = await fetch("/api"+u, { method:m, headers:h(), body:b?JSON.stringify(b):undefined });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error||"שגיאה");
  return d;
};
export const api = {
  login: p => req("POST","/auth/login",{password:p}),
  list: () => req("GET","/admin/clients"),
  create: () => req("POST","/admin/clients"),
  update: (id,d) => req("PUT",`/admin/clients/${id}`,d),
  del: id => req("DELETE",`/admin/clients/${id}`),
  clientData: t => fetch("/api/client/"+t).then(r=>r.ok?r.json():Promise.reject("לא נמצא")),
};
