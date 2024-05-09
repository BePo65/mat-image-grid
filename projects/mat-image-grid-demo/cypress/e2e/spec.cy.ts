describe('Test demo application', () => {
  it('contains header', () => {
    cy.visit('/');
    cy.contains('Mat-Image-Grid-Demo');
    cy.contains('Source on github:');
  });

  it('contains footer', () => {
    cy.visit('/');
    cy.contains('Images from');
  });

  it('navigates to "Simple Grid" as default tab', () => {
    cy.visit('/');
    cy.get('[data-tab-id="0"]').should('have.class', 'mdc-tab--active');
    cy.get('[data-tab-id="1"]').should('not.have.class', 'mdc-tab--active');
    cy.get('[data-tab-id="2"]').should('not.have.class', 'mdc-tab--active');
  });

  it('contains figures and images in tab "Simple Grid"', () => {
    cy.visit('/simple-grid');

    cy.get('[data-tab-id="0"]').should('have.class', 'mdc-tab--active');
    cy.get('figure').should('have.length', 200);
    cy.get('img').should('have.length', 200 * 2);
  });

  it('contains figures and images in tab "Extended Grid"', () => {
    cy.visit('/extended-grid');

    cy.get('[data-tab-id="1"]').should('have.class', 'mdc-tab--active');
    cy.get('figure').should('have.length', 200);
    cy.get('img').should('have.length', 200 * 2);
  });

  it('contains text in tab "Large Dataset"', () => {
    cy.visit('/large-dataset');

    cy.get('[data-tab-id="2"]').should('have.class', 'mdc-tab--active');
    cy.get('app-large-dataset')
      .find('p')
      .should('have.length', 1)
      .invoke('text')
      .should(
        'contain',
        'Placeholder for mat-image-grid with very large dataset',
      );
  });

  it('contains text in tab for non-existing route', () => {
    cy.visit('/non-existing-route');

    cy.get('.page-content')
      .find('h2')
      .should('have.length', 1)
      .invoke('text')
      .should('contain', 'Page not found');
  });
});
