describe('Test demo application', () => {
  it('contains header', () => {
    cy.visit('/');
    cy.contains('MatImageGrid Demo');
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
    const numberOfFigures = 9;

    cy.visit('/simple-grid');

    cy.get('[data-tab-id="0"]').should('have.class', 'mdc-tab--active');
    cy.get('figure').should('have.length', numberOfFigures);
    cy.get('img').should('have.length', numberOfFigures * 2);
  });

  it('contains figures and images in tab "Extended Grid"', () => {
    const numberOfFigures = 9;

    cy.visit('/extended-grid');

    cy.get('[data-tab-id="1"]').should('have.class', 'mdc-tab--active');
    cy.get('figure').should('have.length', numberOfFigures);
    cy.get('img').should('have.length', numberOfFigures * 2);
  });

  it('contains figures and images in tab "Large Dataset"', () => {
    const numberOfFigures = 15;

    cy.visit('/large-dataset');

    cy.get('[data-tab-id="2"]').should('have.class', 'mdc-tab--active');
    cy.get('figure').should('have.length', numberOfFigures);
    cy.get('img').should('have.length', numberOfFigures * 2);
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
