// @ts-check

/** @param {import('express').Router} router */
export default function register(router) {
   router.get('/hello', (req, res) => {
      res.status(200).json({ message: res.locals.t('server.helloMessage') });
   });
}
