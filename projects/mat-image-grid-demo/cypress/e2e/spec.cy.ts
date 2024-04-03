describe('Test demo page', () => {
  it('Visits the initial project page', () => {
    cy.visit('/');
    cy.contains('Mat-Image-Grid-Demo');
    cy.contains('Source on github:');
  });
});
