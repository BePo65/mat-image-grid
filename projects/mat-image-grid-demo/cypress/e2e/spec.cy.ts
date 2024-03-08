describe('Test demo page', () => {
  it('Visits the initial project page', () => {
    cy.visit('/');
    cy.contains('Your app is running.');
  });
});
