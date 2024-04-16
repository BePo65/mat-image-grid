describe('Test demo page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('contains header', () => {
    cy.contains('Mat-Image-Grid-Demo');
    cy.contains('Source on github:');
  });

  it('contains figures and images', () => {
    cy.get('figure').should('have.length', 200);
    cy.get('img').should('have.length', 200 * 2);
  });
});
