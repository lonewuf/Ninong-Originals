const urlProd = 'https://ninongs-originals.herokuapp.com/'

module.exports = {
  client_id : 'AQKFyQ5slFTCzJK4ptOlf-KApv1K4eczFM5ILeifN9FXLs8amP-k9uTj9Msj9LgTUwPbDMFTnhuDw3ZM',
  client_secret : 'EFLnIV3aRBUu3clfkoeQZK3YwaJ3EsZwTZGfTCXXtN9yoer42rptHtt7onnDDTilB4bq6NL9qlH59fvZ',

  // dev
  //success_url : 'http://localhost:2000/cart/success',
  //cancel_url : 'http://localhost:2000/cart/cancel',

  // prod
  success_url : `${urlProd}/cart/success`,
  cancel_url : `${urlProd}/cart/cancel`
}